// Check if ethereum in installed
// Declaring public variables that will be access frequently
let web3;
let contract;
let currentAccount = null;
let matchState;
let players;

// 'init' is called when the site loads
// Attempts to load the Metamask provider and then starts the app
async function init() {
	const provider = await detectEthereumProvider();
	// If the provider exists, start the app
	if(provider) {
		await startApp(provider);
	} else {
		console.log('Unable to detect the wallet provider');
	}
}

// 'startApp' initializes all variables needed for the app to run
async function startApp(provider) {
	// Initialize web3 and the contract
	web3 = new Web3(provider);
	contract = loadContract();
	refreshAll();
	// Set up event listener for a winner
	contract.events.Winner()
		.on('data', (event) => {
			$('#matchSummary').text('Winner: ' + event.returnValues.winner);
			console.log(event.returnValues.winner);
		});

	// Set up event listener for a draw
	contract.events.Draw()
		.on('data', (event) => {
			$('#matchSummary').text('The match was a draw');
			console.log('Draw');
		});
}

// Calls all refresh functions
function refreshAll() {
	refreshPlayers();
	refreshMatchState();
	refreshChoiceSubmissions();
	refreshRevealedChoices();
}

// 'refreshPlayers' checks for the latest on-chain player data
// The refreshed data is displayed on the page
// Returns an array containing the players
async function refreshPlayers() {
	players = await contract.methods.getPlayers().call();
	$('#player1').text(players[0]);
	$('#player2').text(players[1]);
	return players;
}

// Updates the match state
// The refreshed data is displayed on the page
async function refreshMatchState() {
	matchState = await contract.methods.getState().call();
	switch(matchState) {
		case '0':
			$('#matchState').text('Waiting for players to join');
			break;
		case '1':		
			$('#matchState').text('Waiting for players to submit their choices');
			break;
		case '2':		
			$('#matchState').text('Waiting for players to reveal their choices');
			break;
		case '3':		
			$('#matchState').text('Waiting for the match to be settled');
			break;
	}
}

// Updates the choice submission status to be displayed on the page
async function refreshChoiceSubmissions() {
	// Update the matchState in case it may not be up-to-date
	refreshMatchState();
	let responseString;
	// The responseString that is displayed to the user changes depending on the matchState
	if(matchState === 1) {
		// Determine if the user needs to submit a choice or not
		let playerIndex = players.indexOf(currentAccount);
		let p1sub = await contract.methods.encodedChoice(0).call();
		let p2sub = await contract.methods.encodedChoice(1).call();
		responseString = 'Waiting for other player to submit their choice';
		switch(playerIndex) {
			case '0':
				if(p1Sub === 0) {
					responseString = 'You need to submit a choice';
				}
				break;
			case '1':
				if(p2Sub === 0) {
					responseString = 'You need to submit a choice';
				}
				break;
			default:
				// If the user is not part of the game, the matchState indicator
				// gives all the information the user needs to know
				responseString = '';
				break;
		}
	} else if(matchState > 1) {
		responseString = 'Both players have submitted their choice!';
	}
	$('#submitChoiceStatus').text(responseString);
}


// Updates the reveal choices of players to be displayed on the page
async function refreshRevealedChoices() {
	if(matchState > 1) {
		let p1RevealedChoice = await contract.methods.decodedChoice(0).call();
		let p2RevealedChoice = await contract.methods.decodedChoice(1).call();
		let p1RevealedChoiceStr = convertChoiceToString(p1RevealedChoice);
		let p2RevealedChoiceStr = convertChoiceToString(p2RevealedChoice);
		$('#p1RevealedChoice').text("Player1's revealed choice: " + p1RevealedChoiceStr);
		$('#p2RevealedChoice').text("Player2's revealed choice: " + p2RevealedChoiceStr);
	} else {
		$('#p1RevealedChoice').text("Match does not require players to reveal choices yet");
	}
}


// Loads the contract object
function loadContract() {
	let abi = contractDetails.abi;
	let address = prompt('Enter the contract address');
	contract = new web3.eth.Contract(abi, address);
	return contract;
}

// Updates the variable 'currentAccount' with the first account from Metamask
function handleAccountsChanged(accounts) {
	if(accounts.length === 0) {
		console.log('Please connect to Metamask');
	} else if(accounts[0] !== currentAccount) {
		currentAccount = accounts[0];	
		$('#currentAccount').text("Account: " + currentAccount);
		$('#enableEthereum').text('Connected');
		$('#enableEthereum').attr('disabled','disabled');
	}
	refreshAll();
}

async function leaveMatch() {
	await contract.methods.leave().send({from: currentAccount});
	await checkPlayers();
	refreshPlayers();
}

async function submitChoice() {
	// Find which choice the user went with
	let i;
	let key = $('#submitChoiceKey').val();
	let choice;
	for(i = 0; i < 3; i++) {
		if(document.getElementById("choice").elements[i].checked) {
			choice = i + 1;
		}
	}
	let encodedChoice = web3.utils.keccak256(web3.utils.encodePacked(choice, key));
	await contract.methods.submitChoice(encodedChoice).send({ from: currentAccount })
	// Reflect the on-chain changes on the page
	refreshMatchState();
	refreshChoiceSubmissions();
}

// Called when a user want to reveal their choice
async function revealChoice() {
	let key = $('#revealChoiceKey').val();
	let i;
	let choice;
	for(i = 0; i < 3; i++) {
		if(document.getElementById("revealChoiceItem").elements[i].checked) {
			choice = i + 1;
		}
	}
	await contract.methods.revealChoice(choice, key).send({from: currentAccount });
	// Reflect the on-chain changes on the page
	refreshRevealedChoices();
}

// Converts the choice from integer to string
// 1 = rock
// 2 = paper
// 3 = scissors
function convertChoiceToString(inputInt) {
	switch(inputInt) {
		case '0':
			return 'not yet decoded';
			break;
		case '1':
			return 'rock';
			break;
		case '2':
			return 'paper';
			break;
		case '3':	
			return 'scissors';
			break;
		default:
			return 'invalid choice';
			break;
	}
}

// Watch for the 'Enable Ethereum' button to link accounts
$('#enableEthereum').click(function() {		
	// This loads accounts from metamask
	ethereum.request({ method: 'eth_accounts' })
	.then(handleAccountsChanged)
	.catch((err) => {
		console.error(err);
	});
});

// Settles the match and determines a winner
$('#settle').click(async function() {
	await contract.methods.settle().send({from: currentAccount });
	// Reflect the on-chain changes on the page
	refreshAll();
});

// When 'joinMatch' is pressed, the current account is added to the match
$('#joinMatch').click(async () => {
	console.log('joining match');
	await contract.methods.join().send({from: currentAccount});
	refreshPlayers();
	refreshMatchState();
});

// Listen for an event when accounts change, and change the currentAccount variable
ethereum.on('accountsChanged', handleAccountsChanged);

// When 'checkNewPlayers' is clicked, update the list of players
$('#checkNewPlayers').click(() => {checkPlayers();});

// When 'leaveMatch' is clicked, remove the current player from the game
$('#leaveMatch').click(() => {leaveMatch();});

// Button handler
$('#submitChoice').click(() => {submitChoice();});

// Button handler
$('#revealChoice').click(() => {revealChoice();});

// Button handler
$('#refreshRevealedChoices').click(() => {refreshRevealedChoices();});

init();
