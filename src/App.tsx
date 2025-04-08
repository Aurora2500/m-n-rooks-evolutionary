import { useState } from 'react'
import rookImage from './assets/rook.svg';

import {crossUniform, mutFlipBit, selTournament, evolveSimple} from 'eugenics';

const NUM_POP = 150;
const NUM_GENS = 200;

function App() {
	const [size, setSize] = useState(5);

	const [pieces, setPieces] = useState<boolean[][]>(grid(size, false));

	const [removedPieces, setRemovedPieces] = useState<boolean[][]>(grid(size, false));


	const updateSize = (n:number) => {
		setSize(n);
		setPieces(grid(n,false));
		setRemovedPieces(grid(n, false));
	}

	const toggle = (row: number, col: number) => () => {
		setPieces(old => {
			const updated = old.map(r => [...r])
			updated[row][col] = !updated[row][col];
			return updated;
		})
	}

	const optimize = () => {
		const problem: [number, number][] = [];
		let m = 0;
		for (let row = 0; row < size; row++) {
			for (let col = 0; col < size; col++) {
				if (pieces[row][col]) {
					problem.push([row, col]);
					m++;
				}
			}
		}

		const fitness = (individual: boolean[]) => {
			const pieces = problem.filter((_, i) => individual[i])
			let overlap = 0;
			for (let i = 0; i < pieces.length-1; i++) {
				for (let j = i+1; j < pieces.length; j++) {
					if (pieces[i][0] == pieces[j][0] || pieces[i][1] == pieces[j][1]) {
						overlap++;
					}
				}
			}
			return pieces.length - overlap*m
		}

		const population = repeat(NUM_POP, () => repeat(m, () => Math.random() > 0.5));
		const {population: solution, fitnesses: solFitness} = evolveSimple(population, {
			fitness,
			crossover: crossUniform(0.2),
			mutation: mutFlipBit(0.05),
			selection: selTournament,
		}, {
			ngen: NUM_GENS,
		});
		const [best, _] = solution.reduce<[boolean[], number]>(
			([best, best_fit]: [boolean[], number], x, i) => best_fit < solFitness[i]? [x, solFitness[i]]:[best, best_fit],
			[[], Number.NEGATIVE_INFINITY]
		);
		const removedGrid = grid(size, false);
		for (let i = 0; i < problem.length; i++) {
			let [row, col] = problem[i];
			removedGrid[row][col] = !best[i];
		}
		setRemovedPieces(removedGrid);
	}

	return (
		<div className='w-4/5 mx-auto py-8'>
			<h1 className='text-2xl'>M - N rooks problem</h1>
			<div className='flex flex-col'>
			{repeat(size, row => (
					<div className='flex flex-row'>
						{repeat(size, col => (
							<div
								onClick={toggle(row, col)}
								className={`
									w-16 h-16 flex select-none
									${((row+col)%2) == 1 ? 'bg-lime-700' : 'bg-yellow-100'}`}
							>
								{
									pieces[row][col] &&
									<img src={rookImage} alt=""
										className={`pointer-events-none
											${removedPieces[row][col]? 'opacity-40' : ''}`}
									/>
								}
							</div>
						))}
					</div>
				)
			)}
			</div>

			<input
				value={size}
				onChange={(e) => {updateSize(parseInt(e.target.value))}}
				className='border-green-400 border-solid border-2'
				type="number" />
			
			<button
				onClick={optimize}
			>Evolve!</button>
		</div>
	)
}

const repeat = <T,>(n: number, fn: (i: number) => T) =>
	Array.from({length: n}, (_, i) => fn(i))

const grid = <T,>(n: number, x: T): T[][] => 
		repeat(n, () => repeat(n, () => x))

export default App
