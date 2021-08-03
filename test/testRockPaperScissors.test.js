const RockPaperScissors = artifacts.require("RockPaperScissors");

contract("RockPaperScissors", (accounts) => {
	it("Player can connect to a match", async () => {
		const instance = await RockPaperScissors.deployed(); 
		let player1;
		let players;
		await instance.join({from: accounts[0]});
		player1 = accounts[0];
		players = await instance.getPlayers();
		assert.equal(player1, players[0], "dApp does not contain expected player1");
	});

	it("Player can leave match", async () => {
		const instance = await RockPaperScissors.deployed(); 
		let player1;
		let players;
		players = await instance.getPlayers();
		player1 = players[0];
		await instance.leave({from: player1});
		players = await instance.getPlayers();
		assert.equal(0, players[0], "dApp does not contain expected player1");
	});

	it("Player cannot verse themselves", async () => {
		const instance = await RockPaperScissors.deployed(); 
		let player1;
		let player2;
		let players;
		await instance.join({from: accounts[0]});
		let err = null;
		try {
			await instance.join({from: accounts[0]});
		} catch(error) {
			err = error
		}		
		assert.ok(err instanceof Error);
		await instance.leave({from: accounts[0]});
	});

	it("Two players can join match", async () => {
		const instance = await RockPaperScissors.deployed(); 
		let player1;
		let player2;
		let players;
		await instance.join({from: accounts[0]});
		player1 = accounts[0];
		await instance.join({from: accounts[1]});
		player2 = accounts[1];
		players = await instance.getPlayers();
		assert.equal(player1, players[0], "dApp does not contain expected player1");
		assert.equal(player2, players[1], "dApp does not contain expected player2");
	});
	
	it("More than two users can't join a game", async () => {
		const instance = await RockPaperScissors.deployed();
		let err = null;
		try {
			await instance.join({from: accounts[2]});
		} catch(error) {
			err = error;
		}
	 	assert.ok(err instanceof Error);
	});

	it("Match state changes after two players have joined", async () => {
		const instance = await RockPaperScissors.deployed();
		let state = await instance.getState();	
		assert.equal(state.toNumber(), 1, "State has not changed after players have joined");
	});
	
	it("Players cannot leave once a match has started", async () => {
		const instance = await RockPaperScissors.deployed(); 
		let err = null;
		try {
			await instance.leave({from: accounts[0]});
		} catch(error) {
			err = error
		}		
		assert.ok(err instanceof Error);
	});

	it("Players can submit their choices", async () => {
		const instance = await RockPaperScissors.deployed();
		let player1 = accounts[0];
		let player2 = accounts[1];
		let p1ChoiceEncrypted = web3.utils.keccak256(web3.utils.encodePacked(1, 'key1'));
		let p2ChoiceEncrypted = web3.utils.keccak256(web3.utils.encodePacked(2, 'key2'));
		// player1 chooses rock
		await instance.submitChoice(p1ChoiceEncrypted, {from: player1});
		// player2 chooses paper
		await instance.submitChoice(p2ChoiceEncrypted, {from: player2});
		let p1ChoiceRetrieved = await instance.encodedChoice(0);
		let p2ChoiceRetrieved = await instance.encodedChoice(1);
		assert.equal(p1ChoiceRetrieved, p1ChoiceEncrypted, "Encryped value on chain does not match the value that was sent")
		assert.equal(p2ChoiceRetrieved, p2ChoiceEncrypted, "Encryped value on chain does not match the value that was sent")
	});

	it("Non-players can't submit a choice", async () => {
		const instance = await RockPaperScissors.deployed();
		let err = null;
		try {
			await instance.submitChoice(web3.utils.keccak256('verysecure'), {from: accounts[2]});
		} catch(error) {
			err = error;
		}
	 	assert.ok(err instanceof Error);	
	});

	it("Match state changes after both players have submitted their choices", async () => {
		const instance = await RockPaperScissors.deployed();
		let state = await instance.getState();
		assert.equal(state.toNumber(), 2, "State not changed after players have made choices");
	});

	it("Players can reveal their choices", async () => {
		const instance = await RockPaperScissors.deployed();
		let player1 = accounts[0];
		let player2 = accounts[1];
		await instance.revealChoice(1, 'key1', {from: player1});	
		let p1DecodedChoice = await instance.decodedChoice(0);
		assert.equal(p1DecodedChoice.toNumber(), 1, "The expected choice is not actual choice");
		await instance.revealChoice(2, 'key2', {from: player2});	
		let p2DecodedChoice = await instance.decodedChoice(1);
		assert.equal(p2DecodedChoice.toNumber(), 2, "The expected choice is not actual choice");
	});

	it("Non-players can't reveal a choice", async () => {
		const instance = await RockPaperScissors.deployed();
		let err = null;
		try {
			await instance.revealChoice(1, 'securekey', {from: accounts[2]});	
		} catch(error) {
			err = error;
		}
	 	assert.ok(err instanceof Error);	
	});

	it("Match state changes after both players have submitted their choices", async () => {
		const instance = await RockPaperScissors.deployed();
		let state = await instance.getState();
		assert.equal(state.toNumber(), 3, "State not changed after choices revealed");
	});

	it("Settling the match clears the match data", async () => {
		const instance = await(RockPaperScissors.deployed());
		await instance.settle();
		let player1 = await instance.players(0);
		let player2 = await instance.players(1);
		let p1EncodedChoice = await instance.encodedChoice(0);
		let p2EncodedChoice = await instance.encodedChoice(1);
		let p1DecodedChoice = await instance.decodedChoice(0);
		let p2DecodedChoice = await instance.decodedChoice(1);
		let state = await instance.getState();
		assert.equal(state.toNumber(), 0, "Match state has not been reset");
		assert.equal(player1, 0, "player1 has not been reset");
		assert.equal(player2, 0, "player2 has not been reset");
		assert.equal(p1EncodedChoice, 0, "player1's encoded choice has not been reset");
		assert.equal(p2EncodedChoice, 0, "player2's encoded choice has not been reset");
		assert.equal(p1DecodedChoice, 0, "player1's decoded choice has not been reset");
		assert.equal(p2DecodedChoice, 0, "player2's decoded choice has not been reset");
	});

});
