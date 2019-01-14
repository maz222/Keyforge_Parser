class APIParser {
	//dataWrapper - {decks:[], cards:{}}
		//an object (passed by reference) that gets modified with each call
		//decks: an array that stores a list of the decks pulled from the API
		//cards: a dictionary of all cards pulled from the API (stored as [card#]:[cardObject])

	static getURL(pageNumber) {
		var BASE_URL = `https://www.keyforgegame.com/api/decks/?page=${pageNumber}&links=cards`;
		const PROXY_URL = "https://cors-anywhere.herokuapp.com/";
		return(PROXY_URL + BASE_URL);
	}

	static getDeckData(pageNumber=1, endPage=1, dataWrapper) {
		return fetch(this.getURL(pageNumber)) 
			.catch(() => {
				console.log("Error: " + error);
				return dataWrapper;			
			})
			.then((response) => {
				if(!response.ok) {
					console.log("???");
					throw Error(response.statusText);
					return;
				}
				return response.text();
			}).then((contents) => {
				console.log("parsing pg #" + pageNumber);
				//data!
				var data = JSON.parse(contents);
				var parsedData = this.parseData(data);
				//set the deck count
				dataWrapper.deckCount = parsedData.count;
				console.log("parsed deck count");
				//add decks
				dataWrapper.decks = dataWrapper.decks.concat(parsedData.decks);
				console.log("parsed decks");
				//add cards
				var cardKeys = Object.keys(parsedData.cards);
				for(var c in cardKeys) {
					//if a card has already been added, don't add it again (no duplicates)
					if(!(cardKeys[c] in Object.keys(dataWrapper.cards))) {
						dataWrapper.cards[cardKeys[c]] = parsedData.cards[cardKeys[c]];
					}
				}
				console.log("parsed cards");
				//process additional pages
				if(pageNumber < endPage) {
					this.getDeckData(pageNumber+1, endPage, dataWrapper);
				}
			})
			//error - can't get data (either problem with keyforge site, or proxy)
			.catch(() => {
				console.log("Error parsing data");
				return dataWrapper;
			});
	}

	//dataObj - base JSON data from key forge site
		//see http://www.techtrek.io/keyforge-data-scraping-part-1-the-api/
		//data: 
			//count: number of registered decks
			//data: an array of deck objects
				//id: (the unique identifier for the deck)
				//name: (the deck name)
				//expansion: (Right now, there is only one expansion, and it has an ID of 341)
				//power_level: Coming soon in the web interface.  Until then, this is always 0.
				//chains: Coming soon in the web interface.  Until then, this is always 0.
				//wins: Coming soon in the web interface.  Until then, this is always 0.
				//losses: Coming soon in the web interface.  Until then, this is always 0.
				//is_my_deck: false if you are not logged in or if you do not have the deck set as yours.
				//notes: Users can add notes to the decks.  If there are no notes, this will be empty ([])
				//is_my_favorite: false if you are not logged in or if you do not have the deck set as a favorite.
				//_links: an object containing additional data
					//houses: an array containing the three houses features in the deck
					//cards: an array containing the ID's of the cards featured in the deck
			//_linked: an object containg data for all the cards / houses in the game
				//houses: an array of all the houses in the game
					//id: name of the house
					//name: name of the house (same as ID)
					//image: URL for the house symbol image
				//cards: an array of all the cards in the game
					//id: Unique identifier, this is how you would link the information from the data above
					//card_title: Name of the card
					//house: Card House
					//card_type: Such as creature, action, etc
					//front_image: URL of the front image
					//card_text: Text which describes what the card does
					//traits: Can be one or multiple.  Such as Martian or Soldier
					//amber: Number of amber that the card provides, if any (otherwise 0)
					//power: Power level of the card, if any (otherwise 0)
					//armor: Armor on the card, if any (otherwise 0)
					//rarity: Common, Uncommon, Rare, Special
					//flavor_Text: null if none
					//card_Number: the number of the card
					//expansion: Currently there is only one option for this (341)
					//is_maverick: This is a boolean field for if the card is a maverick

	static parseCard(cardJSON) {
		const CARD_PROPS = new Set(["_id","card_title","house","card_type","front_image","card_text","traits","amber",
			"power","armor","rarity","flavor_text","card_number","expansion","is_maverick"]);
		var keys = Object.keys(cardJSON);
		//split the 'traits' string into an array of traits
		cardJSON.traits = (cardJSON.traits == null ? [] : cardJSON.traits.split(" • "));
		//removes any key/value pairs that aren't found in the above list
		for(var k in keys) {
			if(!CARD_PROPS.has(keys[k])) {
				delete cardJSON[keys[k]];
			}
		}
		return cardJSON;
	}

	static parseDeck(deckJSON) {
		deckJSON.houses = deckJSON._links.houses;
		deckJSON.cards = deckJSON._links.cards;
		const DECK_PROPS = new Set(["_id","name","houses","cards"]);
		var keys = Object.keys(deckJSON);
		//removes any key/value pairs that aren't found in the above list
		for(var k in keys) {
			if(!DECK_PROPS.has(keys[k])) {
				delete deckJSON[keys[k]];
			}
		}
		return deckJSON;
	}

	static parseData(dataJSON) {
		const DECK_COUNT = dataJSON.count;
		var decks = dataJSON.data;
		for(var d in decks) {
			decks[d] = this.parseDeck(decks[d]);
		}
		var cards = {};
		for(var c in dataJSON._linked.cards) {
			var temp = this.parseCard(dataJSON._linked.cards[c]);
			cards[temp.card_number] = temp;
		}
		return({count:DECK_COUNT, decks:decks, cards:cards});
	}
}

var webData = {decks:[],cards:{},deckCount:0};
var decks = APIParser.getDeckData(44995, 44996, webData);
decks.then(() => {
	console.log("parsed data:");
	console.log(webData);
})