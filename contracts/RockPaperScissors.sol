pragma solidity ^0.5.0;

/**
@title Rock Paper Scissors smart contract
@author Kalzak
*/
contract RockPaperScissors {
	// Stores the participants for the current match
	address[2] public participants;
	// Stores the encoded choice of the participant (keccak256 plus participants key)
	bytes32[2] public encodedChoice;
	// Stores the decoded choice of the participant (in keccak256)
	string[2] public decodedChoice;
	//Encoded attempt
	bytes32[2] public encodedAttempt;
	
	// The stage of the match
	// 1 = waiting for participants to join
	// 2 = waiting for participants to make choice
    // 3 = waiting for participants to reveal
	// 4 = waiting for participants to settle
	uint8 stage;

	constructor() public{
		stage = 1;
		participants[0] = address(0);
		participants[1] = address(0);

	}

	/**
	@dev Returns the stage of the match
	*/
	function checkStage() public view returns(uint) {
		return stage;
	}

	/**
	@dev Adds a user to the match
	*/
	function join() public {
		// Check if it is the correct stage in the match
		require(stage == 1, "Participants have already joined");	
		// If the first slot is open add the user
		if(participants[0] == address(0)) {
			participants[0] = msg.sender;
		}
		// If the second slot is open
		else if(participants[1] == address(0)) {
			// Check if the user is trying to verse themselves
			require(participants[1] != msg.sender, "You played yourself. Wait, you can't.");
			participants[1] = msg.sender;
			// Update the stage of the match
			stage = 2;
		}
	}
	
	/**
	@dev Returns the users that have joined the match
	*/
	function getParticipants() public view returns(address[2] memory) {
		return participants;
	}

	/**
	@dev Allows users to make their choice for the match
   	*/
	function submitChoice(bytes32 choice) public {
		// Check if it is the correct stage in the match
		require(stage == 2, "The match is not at the stage of submitting choices");
		// Check which participant the user was and add their choice
		if(participants[0] == msg.sender) {
			encodedChoice[0] = choice;
		}else if(participants[1] == msg.sender) {
			encodedChoice[1] = choice;
		}else{
			revert("You are not a participant.");
		}
		// If both encodedChoices are non-empty then go to next stage
		if(encodedChoice[0] != 0 && encodedChoice[1] != 0) {
			// Update the stage of the match
			stage = 3;
		}
	}
	
	/**
	@dev Reveals the choice of the user
	*/
	function revealChoice(string memory choice, string memory key) public {
		// Check if the reveal is done by any of the users involved
		bytes32 encoded = keccak256(abi.encodePacked(choice, key));
		if(participants[0] == msg.sender) {
			encodedAttempt[0] = encoded;
			if(keccak256(abi.encodePacked(choice, key)) == encodedChoice[0]) {
				decodedChoice[0] = choice;
			}	
		}		
		else if(participants[1] == msg.sender) {
			encodedAttempt[1] = encoded;
			if(keccak256(abi.encodePacked(choice, key)) == encodedChoice[1]) {
				decodedChoice[1] = choice;
			}	
		}		
		else {
			revert("You are not a participant.");
		}
		// If both decodedChoices are non-empty then go to the next stage
		if(keccak256(abi.encodePacked(decodedChoice[0])) != keccak256(abi.encodePacked('')) && keccak256(abi.encodePacked(decodedChoice[1])) != keccak256(abi.encodePacked(''))) {
			// Update the stage of the match
			stage = 4;
		}
	}


	/**
   	@dev Settles the match and resets all the variables in preparation for the next match
	*/
	function settle() public returns(address) {
		uint user0Choice;
		uint user1Choice;
		address winner;
		if(keccak256(abi.encodePacked(decodedChoice[0])) == keccak256(abi.encodePacked("rock"))) {
			user0Choice = 1;
		}else if(keccak256(abi.encodePacked(decodedChoice[0])) == keccak256(abi.encodePacked("paper"))) {
			user0Choice = 2;
		}else if(keccak256(abi.encodePacked(decodedChoice[0])) == keccak256(abi.encodePacked("scissors"))) {
			user0Choice = 3;
		}else{
			user0Choice = 0;
		}
		if(keccak256(abi.encodePacked(decodedChoice[1])) == keccak256(abi.encodePacked("rock"))) {
			user1Choice = 1;
		}else if(keccak256(abi.encodePacked(decodedChoice[1])) == keccak256(abi.encodePacked("paper"))) {
			user1Choice = 2;
		}else if(keccak256(abi.encodePacked(decodedChoice[1])) == keccak256(abi.encodePacked("scissors"))) {
			user1Choice = 3;
		}else{
			user1Choice = 0;
		}
		// If draw
		if(user0Choice == user1Choice) {
			winner = address(0);
		// If u0 rock
		}else if(user0Choice == 1) {
			// If u1 paper
			if(user1Choice == 2) {
				// u1 win
				winner = participants[1];
			}else{
			// Else u1 scissors
				winner = participants[0];
			}
		}
		// If u0 paper
		else if(user0Choice == 1) {
			// If u1 scissors
			if(user1Choice == 3) {
				// u1 win
				winner = participants[1];
			}else{
			// Else u1 rock
				winner = participants[0];
			}
		// If u0 scissors
		}else if(user0Choice == 1) {
			// If u1 rock
			if(user1Choice == 1) {
				// u1 win
				winner = participants[1];
			}else{
			// Else u1 paper
				winner = participants[0];
			}
		}
		address[2] storage _participants = participants;
		_participants[0] = address(0);
		_participants[1] = address(0);
		encodedChoice[0] = 0;
		encodedChoice[0] = 0;
		decodedChoice[0] = '';
		decodedChoice[1] = '';
		stage = 1;
		return winner;
	}
}
