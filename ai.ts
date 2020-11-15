// types

type actionTypes = "BREW" | "CAST";

type Order = {
    actionId: number;
    delta: number[];
    price: number;
};

type Spell = {
    actionId: number;
    delta: number[];
    castable: boolean;
    repeatable: boolean;
};

type Recipes = (Order | Spell)[];


// initial values

const initAction = {
    actionId: 0,
    price: 0
};
let nextAction = initAction;
let orders: Order[] = [];
let spells: Spell[] = [];
let userData: any[];

// functinos

const filterAfordableRecipies = (recipes: Recipes, myInventoryDelta: number[]): Recipes => {
  return recipes.filter(recipe => {
      if ((recipe.delta[0] + myInventoryDelta[0]) < 0) return false;
      if ((recipe.delta[1] + myInventoryDelta[1]) < 0) return false;
      if ((recipe.delta[2] + myInventoryDelta[2]) < 0) return false;
      if ((recipe.delta[3] + myInventoryDelta[3]) < 0) return false;
      return true;
  });
}

const filterCastableSpells = (spells: Spell[]): Spell[] => {
  return spells.filter(spell => spell.castable);
}

const maxInventoryDeltaIngredient = (inventoryDelta: number[]): number => {
  return inventoryDelta.indexOf(Math.max(...inventoryDelta));
}

const randomSpell = (castableSpells: spell[]): spell => {
  const randomIndex = Math.floor(Math.random() * castableSpells.length);
  return castableSpells[randomIndex];
}

// game loop
while (true) {

    // reset variables
    nextAction = initAction;
    orders = [];
    spells = [];
    userData = [];

    const actionCount: number = parseInt(readline()); // the number of spells and recipes in play

    for (let i = 0; i < actionCount; i++) {
        var inputs: string[] = readline().split(' ');
        const actionId: number = parseInt(inputs[0]); // the unique ID of this spell or recipe
        const actionType: string = inputs[1]; // in the first league: BREW; later: CAST, OPPONENT_CAST, LEARN, BREW
        const delta0: number = parseInt(inputs[2]); // tier-0 ingredient change
        const delta1: number = parseInt(inputs[3]); // tier-1 ingredient change
        const delta2: number = parseInt(inputs[4]); // tier-2 ingredient change
        const delta3: number = parseInt(inputs[5]); // tier-3 ingredient change
        const price: number = parseInt(inputs[6]); // the price in rupees if this is a potion
        const tomeIndex: number = parseInt(inputs[7]); // in the first two leagues: always 0; later: the index in the tome if this is a tome spell, equal to the read-ahead tax
        const taxCount: number = parseInt(inputs[8]); // in the first two leagues: always 0; later: the amount of taxed tier-0 ingredients you gain from learning this spell
        const castable: boolean = inputs[9] !== '0'; // in the first league: always 0; later: 1 if this is a castable player spell
        const repeatable: boolean = inputs[10] !== '0'; // for the first two leagues: always 0; later: 1 if this is a repeatable player spell

        if (actionType == "BREW") {
            orders.push({
                actionId,
                delta: [delta0, delta1, delta2, delta3],
                price
            });
        }

        if (actionType == "CAST") {
            spells.push({
                actionId,
                delta: [delta0, delta1, delta2, delta3],
                castable,
                repeatable
            });
        }
    }


    for (let i = 0; i < 2; i++) {
        var inputs: string[] = readline().split(' ');
        const inv0: number = parseInt(inputs[0]); // tier-0 ingredients in inventory
        const inv1: number = parseInt(inputs[1]);
        const inv2: number = parseInt(inputs[2]);
        const inv3: number = parseInt(inputs[3]);
        const score: number = parseInt(inputs[4]); // amount of rupees

        const inventoryDelta: number[] = [
          inv0,
          inv1,
          inv2,
          inv3
        ];

        const userDataRow = {
          inventoryDelta,
          score
        }
        userData.push(userDataRow)
    }

    const afordableOrders = filterAfordableRecipies(orders, userData[0].inventoryDelta) as Order[];
    const afordableSpells = filterAfordableRecipies(spells, userData[0].inventoryDelta) as Spell[];
    const castableSpells = filterCastableSpells(afordableSpells);

    if (afordableOrders.length > 0) {
      afordableOrders.forEach(element => {
        if (element.price > nextAction.price ) {
            nextAction = {
                actionId: element.actionId,
                price: element.price
            }
        }
      });
    }

    if (nextAction.price > 0) {
      // in the first league: BREW <id> | WAIT; later: BREW <id> | CAST <id> [<times>] | LEARN <id> | REST | WAIT
      console.log('BREW ' + nextAction.actionId);
    } else if (afordableSpells.length > 0 && castableSpells.length > 1) {
      console.log('CAST ' + randomSpell(castableSpells).actionId);
    } else {
      console.log('REST');  // what's a different between REST and WAIT?

    }


    // Write an action using console.log()
    // To debug: console.error('Debug messages...');
    console.error(`=========`);
    console.error(`afordableOrders: ` + afordableOrders.length);
    console.error(`spellsAvailable: ` + spells.length);
    console.error(`afordableSpells: ` + afordableSpells.length);
    console.error(`myInventoryDelta: ` + userData[0].inventoryDelta);
    console.error(`castableSpells: ` + castableSpells.length);
    console.error(`=========`);


}
