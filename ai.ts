// types

type Delta = number[];

type Order = {
    actionId: number;
    delta: Delta;
    price: number;
};

type Spell = {
    actionId: number;
    delta: Delta;
    castable: boolean;
    repeatable: boolean;
};

type Learn = {
  actionId: number;
  delta: Delta;
  tomeIndex: number;
}

type Recipes = (Order | Spell)[];


// initial values

const initAction = {
    actionId: 0,
    price: 0
};
let nextAction = initAction;
let orders: Order[] = [];
let spells: Spell[] = [];
let learnSpells: Learn[] = [];
let userData: any[];

// functinos

const filterAfordableRecipies = (recipes: Recipes, myInventoryDelta: Delta): Recipes => {
  return recipes.filter(recipe => {
      return (checkMissingIngredients(recipe.delta, myInventoryDelta).length === 0);
  });
}

const filterCastableSpells = (spells: Spell[]): Spell[] => {
  return spells.filter(spell => spell.castable);
}

const maxInventoryDeltaIngredient = (inventoryDelta: Delta): number => {
  return inventoryDelta.indexOf(Math.max(...inventoryDelta));
}

// Strategy 1
const randomSpell = (castableSpells: Spell[]): Spell => {
  const randomIndex = Math.floor(Math.random() * castableSpells.length);
  return castableSpells[randomIndex];
}

// Strategy 2
const chooseSpell = (orders: Order[], myInventoryDelta: Delta, castableSpells: Spell[]): Spell | null => {
  // 1. pick first order with bonus points from the queue
  // 2. check delta for what's missing
  // 3. search for spells that can yeald needed ingredients
  // 4. fallback to random strategy

  const firstOrder = orders[0];
  const missingIngredientsIndexes = checkMissingIngredients(firstOrder.delta, myInventoryDelta);
  const neededIngridientsSpells: Spell[] = castableSpells.filter(spell => {
    if (spell.delta[missingIngredientsIndexes[0]] > 0) {
      return true;
    }
    if (missingIngredientsIndexes.length === 2 && spell.delta[missingIngredientsIndexes[1]] > 0) {
      return true;
    }
    return false;
  })

  if (neededIngridientsSpells.length > 0) {
    return neededIngridientsSpells.pop();
  }

  if (castableSpells.length === 0) {
    return null;
  }

  return randomSpell(castableSpells); // fallback
}

const chooseSpellToLearn = (learnSpells: Learn[], inventoryDelta: Delta): Learn | null => {
  const filter0InventoryTome = learnSpell => {
    return learnSpell.tomeIndex < inventoryDelta[0];
  }
  const maxIngredientIndex = maxInventoryDeltaIngredient(inventoryDelta);
  const filteredLearnSpells = learnSpells
    .filter(learnSpell => {
      return learnSpell.delta[maxIngredientIndex] < 0;
    })
    .filter(filter0InventoryTome);

  if (filteredLearnSpells.length > 0) {
    return filteredLearnSpells.pop();
  }

  const cheapHigherIngredientsSpells = chooseHigherIngredientsSpells(learnSpells)
    .filter(filter0InventoryTome);

  if (cheapHigherIngredientsSpells.length > 0) {
    return cheapHigherIngredientsSpells.pop();
  }

  return learnSpells.filter(filter0InventoryTome).pop(); // just take the last one as a fallback
}

const chooseHigherIngredientsSpells = (learnSpells: Learn[]): Learn[] => {
  return learnSpells
    .filter(learnSpell => { // choose only last two ingredients
      if (learnSpell.delta[3] > 0 || learnSpell.delta[2] > 0) {
        return true;
      }
      return false;
    })
    .filter(learnSpell => { // make some savings here...
      if (learnSpell.delta[1] >= 0 && learnSpell.delta[3] >= 0 && learnSpell.delta[0] > -2) {
        return true;
      }
      return false;
    });
}

// checkes for missing inventory ingredients for given delta
const checkMissingIngredients = (delta: Delta, myInventoryDelta: Delta): number[] => {
  const missingIngredientsIndexes = [];

  if ((delta[0] + myInventoryDelta[0]) < 0) {
    missingIngredientsIndexes.push(0);
  }
  if ((delta[1] + myInventoryDelta[1]) < 0) {
    missingIngredientsIndexes.push(1);
  }
  if ((delta[2] + myInventoryDelta[2]) < 0) {
    missingIngredientsIndexes.push(2);
  }
  if ((delta[3] + myInventoryDelta[3]) < 0) {
    missingIngredientsIndexes.push(3);
  }

  return missingIngredientsIndexes;
}

const spellInventorySpam = (spell: Spell | null, inventoryDelta: number[]): boolean => {
  if (spell === null) return false;

  const maxIngredientIndex = maxInventoryDeltaIngredient(inventoryDelta);
  const maxInventoryIngredientValue = inventoryDelta[maxIngredientIndex];
  if (maxInventoryIngredientValue < 4) {
    return false;
  }
  const spellIngedientValue = spell.delta[maxIngredientIndex];
  if (spellIngedientValue > 0) {
    return true;
  }
  return false;
}

// strategy 3 - aha! custom shit ust to get a bit of headstart
const performSpecialActions = (orders: Order[], myInventoryDelta: Delta, learnSpells: Learn[]): string | null => {

    const filter0InventoryTome = learnSpell => {
        return learnSpell.tomeIndex < myInventoryDelta[0];
    }

    const canAffordIt = learn => (learn.tomeIndex < 2 || learn.tomeIndex < myInventoryDelta[0])
    const cmpDelta = (learn: Learn, delta: Delta) => learn.delta.toString() === delta.toString()

    // Lear quickly a very powerful spells
    const powerfulSpellDeltas = learn => (
        cmpDelta(learn, [1,0,1,0])
        || cmpDelta(learn, [0,0,1,0])
    );

    const learnPowerfullSpells = learnSpells
        .filter(learn => (powerfulSpellDeltas(learn) && canAffordIt(learn)));

    learnPowerfullSpells.map(learn => console.error(`====== learnPowerfullSpells: ` + learn.delta + ` ` + learn.tomeIndex))

    if (learnPowerfullSpells.length > 0) {
        return `LEARN ${learnPowerfullSpells.shift().actionId}`
    }

    return null;
}

// game loop
while (true) {

    // reset variables
    nextAction = initAction;
    orders = [];
    spells = [];
    userData = [];
    learnSpells = [];

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

        if (actionType === "BREW") {
            orders.push({
                actionId,
                delta: [delta0, delta1, delta2, delta3],
                price
            });
        }

        if (actionType === "CAST") {
            spells.push({
                actionId,
                delta: [delta0, delta1, delta2, delta3],
                castable,
                repeatable
            });
        }

        if (actionType === "LEARN") {
            learnSpells.push({
                actionId,
                delta: [delta0, delta1, delta2, delta3],
                tomeIndex
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
    const myInventory = userData[0].inventoryDelta;

    const afordableOrders = filterAfordableRecipies(orders, myInventory) as Order[];
    const afordableSpells = filterAfordableRecipies(spells, myInventory) as Spell[];
    const castableSpells = filterCastableSpells(afordableSpells);
    const spellToCast = chooseSpell(orders, myInventory, castableSpells);
    const learnSpell = chooseSpellToLearn(learnSpells, myInventory);
    const spamSpell = spellInventorySpam(spellToCast, myInventory);
    const specialActions = performSpecialActions(orders, myInventory, learnSpells);

    // in the first league: BREW <id> | WAIT; later: BREW <id> | CAST <id> [<times>] | LEARN <id> | REST | WAIT

    if (afordableOrders.length > 0) {

      afordableOrders.forEach(element => {
        if (element.price > nextAction.price ) {
            nextAction = {
                actionId: element.actionId,
                price: element.price
            }
        }
      });
      console.log('BREW ' + nextAction.actionId);
    } else if (specialActions !== null) {
      console.log(specialActions);
    } else if (castableSpells.length > 0 && spamSpell === false) {
      console.log('CAST ' + spellToCast.actionId);
    } else if (castableSpells.length > 1 && spamSpell === true && learnSpell) {
      console.log('LEARN ' + learnSpell.actionId);
      console.error(`learnSpell tomeIndex: ` + learnSpell.tomeIndex);
    } else {
      console.log('REST');  // what's a different between REST and WAIT?
    }

    // debug
    console.error(`=========`);
    console.error(`afordableOrders: ` + afordableOrders.length);
    console.error(`spellsAvailable: ` + spells.length);
    console.error(`afordableSpells: ` + afordableSpells.map(spell => spell.actionId));
    console.error(`myInventoryDelta: ` + userData[0].inventoryDelta);
    console.error(`castableSpells: ` + castableSpells.map(spell => spell.actionId));
    console.error(`LearnSpells: ` + learnSpells.length);
    console.error(`repeatable: ` + castableSpells.filter(spell => spell.repeatable).map(spell => spell.actionId));
    console.error(`spellToCast: ` + spellToCast);
    console.error(`=========`);


}
