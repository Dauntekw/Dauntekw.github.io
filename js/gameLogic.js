/******************************************************************************
 * gameLogic
 * Author: Daunte Williamson
 * Brief: 
 *    Core game logic for Blackjack.
 *    WIN CONDITIONS
 *    -   Player draws a hand value greater than the dealer's hand
 *    -   Dealer draws a hand value greater than 21 (DEALER BUST)
 *    -   Player draws a hand value of 21 on the first 2 cards (BLACKJACK)
 *    LOSE CONDITIONS
 *    -   Player draws a hand value greater than 21 (PLAYER BUST)
 *    -   Dealer draws a hand value greater than the player's hand
 *****************************************************************************/

const SUITS = ["HEARTS", "SPADES", "CLUBS", "DIAMONDS"];
const RANKED_FACES = ["Jack", "Queen", "King", "Ace"];
const RANKED_TOTAL = { jack: 4, queen: 4, king: 4, ace: 4 };
const FACE = { min: 2, max: 11 };
const PLAYS = { stand: 0, hit: 1, double: 2, split: 3, surrender: 4 };

var doubleDownActive = false;
var splitActive = false;
var canSplit = false;
var suitRankTotal = { hearts: 0, spades: 0, clubs: 0, diamonds: 0 };

var deck = [];
var playerHand = [];
var splitHand = [];
var dealerHand = [];

var buyIn = 0;
var playerCash = 1000;
var payout = 0;

class Card {
  constructor(_suit, _value, _rank) {
    this.CheckSuit(_suit);
    this.CheckValue(_value);
    this.CheckRank(_rank);
  }

  CheckRank(_rank) {
    if (_rank == "high") {
      switch (this.suit) {
        case SUITS[0]:
          this.rank = RANKED_FACES[suitRankTotal.hearts++];
          break;
        case SUITS[1]:
          this.rank = RANKED_FACES[suitRankTotal.spades++];
          break;
        case SUITS[2]:
          this.rank = RANKED_FACES[suitRankTotal.clubs++];
          break;
        case SUITS[3]:
          this.rank = RANKED_FACES[suitRankTotal.diamonds++];
          break;
      }
    } else {
      this.rank = _rank;
    }
  }

  CheckSuit(_suit) {
    if (SUITS.includes(_suit.toUpperCase()))
      this.suit = _suit;
    else 
      console.log("Invalid card: Suit is not acceptable");
  }

  CheckValue(_value) {
    if (_value >= FACE.min && _value <= FACE.max)
      this.value = _value;
    else
      console.log("Invalid card: Value is out of range");
  }

  FaceValue() {
    return this.value;
  }

  SetFaceValue(_val) {
    this.value = _val;
  }

  FaceUp() {
    if (this.rank == "low")
      console.log(this.value + " of " + this.suit);
    else
      console.log(this.rank + " of " + this.suit);
  }

  FaceString() {
    var output = "";

    if (this.rank == "low")
      output = this.value + " of " + this.suit;
    else
      output = this.rank + " of " + this.suit;

    return output;
  }
}

function init() {
  document.getElementById("ResetButton").setAttribute("hidden", true);
  document.getElementById("PlayButton").removeAttribute("hidden");

  updateBuyIn("max", playerCash);
  if (buyIn > playerCash) {
    updateBuyIn("value", playerCash);
  }
  updateText("pHand", "");
  updateText("sHand", "");
  updateText("dHand", "");
  updateText("pValue", "");
  updateText("sValue", "");
  updateText("dValue", "");
  updateText("message", "Place your bet!");
  updateText("cheatMessage", "");
  updateDisabled("cheatFace", (playerCash >= 2500) ? false : true);
  disableAllButtons();
  updateDisabled("PlayerInput", false);
  updateDisabled("PlayButton", false);
  document.getElementById("sh").setAttribute("hidden", true);

  playerHand = [];
  splitHand = [];
  dealerHand = [];
  suitRankTotal.hearts = 0;
  suitRankTotal.clubs = 0;
  suitRankTotal.diamonds = 0;
  suitRankTotal.spades = 0;
  doubleDownActive = false;
  splitActive = false;
  canSplit = false;

  fillDeck();

  if (deck.length > 0) {
    //displayCards();
    shuffleDeck();
    updateCashDisplay();
  }
  else
    console.log("ERROR: Deck did not fill");
}

function updateCashDisplay() {
  updateText("p01", "Player Cash: $" + playerCash);
}

function fillDeck() {
  deck = [];

  for (var i = 0; i < 4; i++) {
    for (var j = FACE.min; j <= FACE.max; j++) {
      let c = new Card(SUITS[i], j, (j == FACE.max) ? "high" : "low");

      deck.push(c);

      if (j == FACE.max - 1) {
        //Account for face cards with same value as 10 - Jack, Queen, King
        for (var k = 3; k > 0; k--) {
          let fc = new Card(SUITS[i], j, "high");

          deck.push(fc);
        }
      }
    }
  }

  console.log(deck.length);
}

function shuffleDeck() {
  for (var i = deck.length - 1; i > 0; i--) {
    let j = randIntFromRange(0, i);
    let temp = deck[i];

    deck[i] = deck[j];
    deck[j] = temp;
  }

  console.log(deck.length);
}

function displayCards() {
  for (var i = 0; i < deck.length; i++)
    deck[i].FaceUp();
}

function drawCards(hand, n) {
  var aceCount = 0;
  var handVal = 0;

  for (let i = n; i > 0; i--) {
    let c = deck.pop();

    if (c.rank == "Ace") {
      aceCount++;

      if (aceCount == 2 || c.FaceValue() + handVal > 21)
        c.SetFaceValue(1);
    }

    handVal += c.FaceValue();

    switch (hand) {
      case "player":
        playerHand.push(c);
        break;
      case "dealer":
        dealerHand.push(c);
        break;
      case "split":
        splitHand.push(c);
        break;
    }
  }
}

function getHandTotal(hand) {
  let total = 0;

  for (let i = 0; i < hand.length; i++)
    total += hand[i].FaceValue();

  return total;
}

function storePlayerData() {
  var input = document.getElementById("PlayerInput");

  buyIn = input.value;
  init();
  startRound();
}

function startRound() {
  drawCards("player", 2);
  console.log(playerHand.length);
  drawCards("dealer", 2);
  splitEnabler();
  let dT = getHandTotal(dealerHand);
  if (dT <= 16) {
    while (dT <= 16) {
      drawCards("dealer", 1);
      dT = getHandTotal(dealerHand);
    }
  }
  checkTable();
}

function checkTable() {
  let dT = getHandTotal(dealerHand); //Dealer hand total
  let pT = getHandTotal(playerHand); //Player hand total
  let sT = (splitActive) ? getHandTotal(splitHand) : 0;
  let pText = "Player Hand: ";
  splitEnabler();
  updateDisabled("PlayerInput", true);
  updateDisabled("PlayButton", true);
  updateDisabled("dd", doubleDownActive || buyIn * 2 > playerCash || splitActive);
  if (canSplit) {
    updateDisabled("sp", splitActive);
  } else {
    updateDisabled("sp", !canSplit);
  }
  for (let i = 0; i < playerHand.length; i++) {
    pText += playerHand[i].FaceString();
    if (i != playerHand.length - 1)
      pText += ", ";
  }
  updateText("pHand", pText);
  updateText("dHand", "Dealer Hand: " + dealerHand[0].FaceString());
  updateText("pValue", "Value = " + pT);

  if (splitActive) {
    let sText = "Split Hand: ";
    for (let i = 0; i < splitHand.length; i++) {
      sText += splitHand[i].FaceString();
      if (i != splitHand.length - 1)
        sText += ", ";
    }
    updateText("sHand", sText);;
    updateText("sValue", "Value = " + sT);
  }

  if (splitActive) {
    if (sT < 21) {
      document.getElementById("sh").removeAttribute("hidden");
    } else {
      buyIn /= 2
      document.getElementById("sh").setAttribute("hidden", true);
    }
  }

  if (pT >= 21 || dT >= 21)
    endRound();
  else {
    updateText("message", "What is your next move?");
    updateDisabled("hit", false);
    updateDisabled("st", false);
    updateDisabled("sur", false);
  }
}

function hit() {
  drawCards("player", 1);
  checkTable();
}

function splitHit() {
  drawCards("split", 1);
  checkTable();
}

function doubleDown() {
  buyIn *= 2;
  doubleDownActive = true;
  canSplit = false;
  updateBuyIn("value", buyIn);
  hit();
}

function split() {
  let c;
  let splitIndex = -1;

  if (playerHand.length > 2) {
    for (let i = 0; i < playerHand.length; i++) {
      let temp = playerHand[i].FaceValue();

      for (let k = i + 1; k < playerHand.length; k++) {
        if (playerHand[k].FaceValue() == temp) {
          splitIndex = k;
          break;
        }
      }
      if (splitIndex != -1) {
        c = playerHand[splitIndex];
        playerHand.splice(splitIndex, 1);
        break;
      }
    }
  } else {
    c = playerHand.pop();
  }

  buyIn *= 2;
  splitActive = true;
  splitHand.push(c);
  updateBuyIn("value", buyIn);
  drawCards("player", 1);
  drawCards("split", 1);
  checkTable();
}

function splitEnabler() {
  if (doubleDownActive) {
    canSplit = false;
    return;
  }
  for (let i = 0; i < playerHand.length; i++) {
    let temp = playerHand[i].FaceValue();
    for (let j = i + 1; j < playerHand.length; j++) {
      if (playerHand[j].FaceValue() == temp) {
        canSplit = true;
        return;
      }
    }
  }
}

function reset() {
  playerCash = 1000;
  document.getElementById("PlayerInput").value = 20;
  buyIn = 20;
  init();
}

function surrender() {
  buyIn /= 2;
  playerCash -= buyIn;
  init();
}

function endRound() {
  let dT = getHandTotal(dealerHand); //Dealer hand total
  let pT = getHandTotal(playerHand); //Player hand total
  let sT = (splitActive) ? getHandTotal(splitHand) : 0; //Split hand total
  let mult = 2;
  let dText = document.getElementById("dHand").innerHTML + ", ";

  for (let i = 1; i < dealerHand.length; i++) {
    dText += dealerHand[i].FaceString();
    if (i != dealerHand.length - 1)
      dText += ", ";
  }

  updateText("dHand", dText);
  updateText("dValue", "Value = " + dT);
  disableAllButtons();

  if (pT > dT && pT <= 21 || dT > 21) {
    if (playerHand.length == 2 && pT == 21)
      mult += 1.5;

    payout = buyIn * mult;
    playerCash += payout;
    updateText("message", "Player Wins!");
  }
  else if (sT != 0 && (sT > dT && sT <= 21)) {
    mult = 2;

    if (splitHand.length == 2 && sT == 21) {
      mult += 1.5;
    }
    payout = buyIn * mult;
    playerCash += payout;
    updateText("message", "Player Wins!");
  } else if (pT == dT && pT <= 21) {
    updateText("message", "Draw.");
  } else {
    console.log("Loss amount: " + buyIn + ". Previous cash: " + playerCash + ". New Cash: " + (playerCash - buyIn));
    playerCash -= buyIn;
    if (buyIn > playerCash) {
      updateBuyIn("max", playerCash);
      document.getElementById("PlayerInput").value = playerCash;
      document.getElementById("PlayerInput").focus();
    }
    updateText("message","Player Loses.");

  }
  updateText("cheatMessage", "");
  updateCashDisplay();
  if (playerCash <= 0) {
    playerCash = 0;
    document.getElementById("PlayerInput").value = playerCash;
    updateText("message", "Player Loses. Cannot continue due to insufficient funds.");
    document.getElementById("PlayButton").setAttribute("hidden", true);
    document.getElementById("ResetButton").removeAttribute("hidden");
  } else {
    updateDisabled("PlayerInput", false);
    updateDisabled("PlayButton", false);
  }

}

function cheatFace() {
  playerCash -= 2500;
  let faceCount = 0;
  for (let i = 0; i < deck.length; i++) {
    if (deck[i].rank != "low")
      faceCount++;
  }
  updateCashDisplay();
  updateText("cheatMessage", "There are " + faceCount + " face cards in the deck.");
  updateDisabled("cheatFace", true);
}

function disableAllButtons() {
  updateDisabled("st", true);
  updateDisabled("hit", true);
  updateDisabled("sh", true);
  updateDisabled("sp", true);
  updateDisabled("dd", true);
  updateDisabled("sur", true);
  updateDisabled("cheatFace", true);
}

/*                         *
 * ---Utility functions--- *
 *                         */

function updateBuyIn(attr, val) {
  document.getElementById("PlayerInput").setAttribute(attr, val);
}

function updateDisabled(element, isDisabled) {
  document.getElementById(element).disabled = isDisabled;
}

function updateDivVisibility(element, mode) {
  document.getElementById(element).style.display = mode;
}

function updateText(element, text) {
  document.getElementById(element).innerHTML = text;
}

function randIntFromRange(min, max) {
  return Math.floor(Math.random() * (max - min + 1) + min);
}