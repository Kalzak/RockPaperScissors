# Rock Paper Scissors DApp
A simple rock paper scissors game for the Ethereum network.  I made this to get a feel of Solidity, Web3js and how they interact with each other.
Since this game is running on the blockchain, a couple of comfort features have been added for players.
- Match state indicating the progress of the match
    1. Joining
	2. Submitting choice
	3. Revealing choice
	4. Settling match (deciding winner)
- Players can leave if match is still in joining state

The method to hide the player choices while the match is progress was taken from the  'Polls' app in the Solidity documentation.

My main focus was to learn Solidity and Web3js, so the design of the frontend may not be striking, but that was not the purpose of this project.

## Installation

1. Clone the repo
2. Install dependencies with `npm i`

## Testing

1. Open two terminal windows
2. Inside the git directory on the first terminal run `npx ganache`
3. Inside the git directory on the second terminal run `npx truffle test`
