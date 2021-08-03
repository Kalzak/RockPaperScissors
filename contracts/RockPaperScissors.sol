pragma solidity ^0.5.0;

/**
@title Rock Paper Scissors smart contract
@author @kalzakdev
@notice You can use this contract to play rock paper scissors
*/
contract RockPaperScissors {
	// Stores the players in current match
	address[2] public players;

	// Stores encoded player choices
	bytes32[2] public encodedChoice;

	// Stores players choice as an int
	// 0 = Empty
	// 1 = Rock
	// 2 = Paper
	// 3 = Scissors
	uint[2] public decodedChoice;

	// Enum to store the state of the match	
	enum MatchState{Join, Choose, Reveal, Settle}
	MatchState state;

	// Constructor sets all match variables to default state
	constructor() public{
		reset();
	}
	
	// Only allows players to access functions
	modifier onlyPlayers() {
		bool isPlayer = (msg.sender == players[0] || msg.sender == players[1]);
		require(isPlayer == true, "You are not a player in the current match");
		_;
	}

	/**
	@notice Returns the state of the current match
       	@return Match state where 0 = Join, 1 = Choose, 2 = Reveal, 3 = Settle
	*/
	function getState() public view returns(uint) {
		return uint(state);
	}

	/**
	@notice Returns the current players in the match
       	@return Address array of size two containing players
	*/
	function getPlayers() public view returns(address[2] memory) {
		return players;
	}

	/**
	@notice Adds the message sender to the match
	*/
	function join() public {
		// Check if correct match state
		require(state == MatchState.Join, "Match does not need players to join currently");
		// If no players have joined match yet	
		if(players[0] == address(0)) {
			players[0] = msg.sender;
		// If one players is already in match
		} else {
			// Players can't verse themselves
			require(players[0] != msg.sender, "You played yourself. Wait, you can't.");
			players[1] = msg.sender;
			// Update the match state
			state = MatchState.Choose;
		}
	}

	/**
	@notice Removes message sender from match if no opponent has joined
	*/
	function leave() public onlyPlayers {
		// Check if correct match state
		require(state == MatchState.Join, "Match does not need players to join currently");
		// Remove the player from the match
		players[0] = address(0);
	}

	/**
	@notice Accepts and saves the players encoded choices
       	@param choice is keccak256 encoded user choice in the format of (choice, key)
	*/
	function submitChoice(bytes32 choice) public onlyPlayers {
		// Check if correct match state
		require(state == MatchState.Choose, "Match does not need players to choose currently");
		// Store the users encoded choice
		if(players[0] == msg.sender) {
			encodedChoice[0] = choice;
		} else {
			encodedChoice[1] = choice;
		}
		// If both users have submitted their choices then go to next match state
		if(encodedChoice[0] != 0 && encodedChoice[1] != 0) {
			// Update the match state
			state = MatchState.Reveal;
		}
	}
	
	// Reveals a players choice
	/**
	@notice Reveals a players choice
       	@param choice is the users choice, key is the key the users passed from their encoded choice
	*/
	function revealChoice(uint choice, string memory key) public onlyPlayers {
		// Check if correct match state
		require(state == MatchState.Reveal, "Match does not need players to reveal currently");
		// Encode the values given
		bytes32 encoded = keccak256(abi.encodePacked(choice, key));
		// Check if the encoded values match the players previous encoded choices
		if(players[0] == msg.sender) {
			if(encoded == encodedChoice[0]) {
				decodedChoice[0] = choice;
			}
		} else {
			if(encoded == encodedChoice[1]) {
				decodedChoice[1] = choice;
			}
		}
		// If both players have revealed their choice
		if(decodedChoice[0] != 0 && decodedChoice[1] != 0) {
			// Update the match state
			state = MatchState.Settle;
		}
	}
	
	/**
	@notice Decides a winner and resets the match state
	*/	  
       	function settle() public onlyPlayers returns(address) {
		require(state == MatchState.Settle, "Match does not need players to settle currently");
		uint p1Choice = decodedChoice[0];
		uint p2Choice = decodedChoice[1];
		if(p1Choice == p2Choice) {
			draw();
		} else {
			if((p1Choice - 1) == p2Choice % 3) {
				win(players[0]);
			} else {
				win(players[1]);
			}
		}
		reset();
	}

	/**
	@notice Resets all match varaibles for the next match
	*/
	function reset() internal {
		players[0] = address(0);	
		players[1] = address(0);
		encodedChoice[0] = 0;
		encodedChoice[1] = 0;
		decodedChoice[0] = 0;
		decodedChoice[1] = 0;
		state = MatchState.Join;
	}

	/**
	@notice Declares the winner
	*/
	function win(address winner) internal returns(bool){
		return true;
	}

	/**
	@notice Declares a draw
	*/
	function draw() internal returns(bool) {
		return true;
	}	
}
