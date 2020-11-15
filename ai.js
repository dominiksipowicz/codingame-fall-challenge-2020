// types
// initial values
var initAction = {
    actionId: 0,
    price: 0
};
var nextAction = initAction;
var orders = [];
var spells = [];
var learnSpells = [];
var userData;
// functinos
var filterAfordableRecipies = function (recipes, myInventoryDelta) {
    return recipes.filter(function (recipe) {
        return (checkMissingIngredients(recipe.delta, myInventoryDelta).length === 0);
    });
};
var filterCastableSpells = function (spells) {
    return spells.filter(function (spell) { return spell.castable; });
};
var maxInventoryDeltaIngredient = function (inventoryDelta) {
    return inventoryDelta.indexOf(Math.max.apply(Math, inventoryDelta));
};
// Strategy 1
var randomSpell = function (castableSpells) {
    var randomIndex = Math.floor(Math.random() * castableSpells.length);
    return castableSpells[randomIndex];
};
// Strategy 2
var chooseSpell = function (orders, myInventoryDelta, castableSpells) {
    // 1. pick first order with bonus points from the queue
    // 2. check delta for what's missing
    // 3. search for spells that can yeald needed ingredients
    // 4. fallback to random strategy
    var firstOrder = orders[0];
    var missingIngredientsIndexes = checkMissingIngredients(firstOrder.delta, myInventoryDelta);
    var neededIngridientsSpells = castableSpells.filter(function (spell) {
        if (spell.delta[missingIngredientsIndexes[0]] > 0) {
            return true;
        }
        if (missingIngredientsIndexes.length === 2 && spell.delta[missingIngredientsIndexes[1]] > 0) {
            return true;
        }
        return false;
    });
    if (neededIngridientsSpells.length > 0) {
        return neededIngridientsSpells.pop();
    }
    if (castableSpells.length === 0) {
        return null;
    }
    return randomSpell(castableSpells); // fallback
};
var chooseSpellToLearn = function (learnSpells, inventoryDelta) {
    var filter0InventoryTome = function (learnSpell) {
        return learnSpell.tomeIndex < inventoryDelta[0];
    };
    var maxIngredientIndex = maxInventoryDeltaIngredient(inventoryDelta);
    var filteredLearnSpells = learnSpells
        .filter(function (learnSpell) {
        return learnSpell.delta[maxIngredientIndex] < 0;
    })
        .filter(filter0InventoryTome);
    if (filteredLearnSpells.length > 0) {
        return filteredLearnSpells.pop();
    }
    var cheapHigherIngredientsSpells = chooseHigherIngredientsSpells(learnSpells)
        .filter(filter0InventoryTome);
    if (cheapHigherIngredientsSpells.length > 0) {
        return cheapHigherIngredientsSpells.pop();
    }
    return learnSpells.filter(filter0InventoryTome).pop(); // just take the last one as a fallback
};
var chooseHigherIngredientsSpells = function (learnSpells) {
    return learnSpells
        .filter(function (learnSpell) {
        if (learnSpell.delta[3] > 0 || learnSpell.delta[2] > 0) {
            return true;
        }
        return false;
    })
        .filter(function (learnSpell) {
        if (learnSpell.delta[1] >= 0 && learnSpell.delta[3] >= 0 && learnSpell.delta[0] > -2) {
            return true;
        }
        return false;
    });
};
// checkes for missing inventory ingredients for given delta
var checkMissingIngredients = function (delta, myInventoryDelta) {
    var missingIngredientsIndexes = [];
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
};
var spellInventorySpam = function (spell, inventoryDelta) {
    if (spell === null)
        return false;
    var maxIngredientIndex = maxInventoryDeltaIngredient(inventoryDelta);
    var maxInventoryIngredientValue = inventoryDelta[maxIngredientIndex];
    if (maxInventoryIngredientValue < 4) {
        return false;
    }
    var spellIngedientValue = spell.delta[maxIngredientIndex];
    if (spellIngedientValue > 0) {
        return true;
    }
    return false;
};
// strategy 3 - aha! custom shit ust to get a bit of headstart
var performSpecialActions = function (orders, myInventoryDelta, learnSpells, castableSpells) {
    var filter0InventoryTome = function (learnSpell) {
        return learnSpell.tomeIndex < myInventoryDelta[0];
    };
    var canAffordIt = function (learn) { return (learn.tomeIndex < 2 || learn.tomeIndex < myInventoryDelta[0]); };
    var cmpDelta = function (learn, delta) { return learn.delta.toString() === delta.toString(); };
    // Learn quickly a very powerful spells
    var powerfulSpellDeltas = function (learn) { return (cmpDelta(learn, [1, 0, 1, 0])
        || cmpDelta(learn, [0, 0, 1, 0])
        || cmpDelta(learn, [2, 1, 0, 0])); };
    var learnPowerfullSpells = learnSpells
        .filter(function (learn) { return (powerfulSpellDeltas(learn) && canAffordIt(learn)); });
    learnPowerfullSpells.map(function (learn) { return console.error("====== learnPowerfullSpells: " + learn.delta + " " + learn.tomeIndex); });
    if (learnPowerfullSpells.length > 0) {
        return "LEARN " + learnPowerfullSpells.shift().actionId;
    }
    // cast spell to get ride of too much tier-0 ingridients
    if (myInventoryDelta[0] >= 5) {
        var spellsToReduceTier0 = castableSpells.filter(function (spell) { return (spell.delta[0] < 0); });
        if (spellsToReduceTier0.length > 0) {
            return "CAST " + spellsToReduceTier0.shift().actionId;
        }
    }
    return null;
};
// game loop
while (true) {
    // reset variables
    nextAction = initAction;
    orders = [];
    spells = [];
    userData = [];
    learnSpells = [];
    var actionCount = parseInt(readline()); // the number of spells and recipes in play
    for (var i = 0; i < actionCount; i++) {
        var inputs = readline().split(' ');
        var actionId = parseInt(inputs[0]); // the unique ID of this spell or recipe
        var actionType = inputs[1]; // in the first league: BREW; later: CAST, OPPONENT_CAST, LEARN, BREW
        var delta0 = parseInt(inputs[2]); // tier-0 ingredient change
        var delta1 = parseInt(inputs[3]); // tier-1 ingredient change
        var delta2 = parseInt(inputs[4]); // tier-2 ingredient change
        var delta3 = parseInt(inputs[5]); // tier-3 ingredient change
        var price = parseInt(inputs[6]); // the price in rupees if this is a potion
        var tomeIndex = parseInt(inputs[7]); // in the first two leagues: always 0; later: the index in the tome if this is a tome spell, equal to the read-ahead tax
        var taxCount = parseInt(inputs[8]); // in the first two leagues: always 0; later: the amount of taxed tier-0 ingredients you gain from learning this spell
        var castable = inputs[9] !== '0'; // in the first league: always 0; later: 1 if this is a castable player spell
        var repeatable = inputs[10] !== '0'; // for the first two leagues: always 0; later: 1 if this is a repeatable player spell
        if (actionType === "BREW") {
            orders.push({
                actionId: actionId,
                delta: [delta0, delta1, delta2, delta3],
                price: price
            });
        }
        if (actionType === "CAST") {
            spells.push({
                actionId: actionId,
                delta: [delta0, delta1, delta2, delta3],
                castable: castable,
                repeatable: repeatable
            });
        }
        if (actionType === "LEARN") {
            learnSpells.push({
                actionId: actionId,
                delta: [delta0, delta1, delta2, delta3],
                tomeIndex: tomeIndex
            });
        }
    }
    for (var i = 0; i < 2; i++) {
        var inputs = readline().split(' ');
        var inv0 = parseInt(inputs[0]); // tier-0 ingredients in inventory
        var inv1 = parseInt(inputs[1]);
        var inv2 = parseInt(inputs[2]);
        var inv3 = parseInt(inputs[3]);
        var score = parseInt(inputs[4]); // amount of rupees
        var inventoryDelta = [
            inv0,
            inv1,
            inv2,
            inv3
        ];
        var userDataRow = {
            inventoryDelta: inventoryDelta,
            score: score
        };
        userData.push(userDataRow);
    }
    var myInventory = userData[0].inventoryDelta;
    var afordableOrders = filterAfordableRecipies(orders, myInventory);
    var afordableSpells = filterAfordableRecipies(spells, myInventory);
    var castableSpells = filterCastableSpells(afordableSpells);
    var spellToCast = chooseSpell(orders, myInventory, castableSpells);
    var learnSpell = chooseSpellToLearn(learnSpells, myInventory);
    var spamSpell = spellInventorySpam(spellToCast, myInventory);
    var specialActions = performSpecialActions(orders, myInventory, learnSpells, castableSpells);
    // in the first league: BREW <id> | WAIT; later: BREW <id> | CAST <id> [<times>] | LEARN <id> | REST | WAIT
    if (afordableOrders.length > 0) {
        afordableOrders.forEach(function (element) {
            if (element.price > nextAction.price) {
                nextAction = {
                    actionId: element.actionId,
                    price: element.price
                };
            }
        });
        console.log('BREW ' + nextAction.actionId);
    }
    else if (specialActions !== null) {
        console.log(specialActions);
    }
    else if (castableSpells.length > 0 && spamSpell === false) {
        console.log('CAST ' + spellToCast.actionId);
    }
    else if (castableSpells.length > 1 && spamSpell === true && learnSpell) {
        console.log('LEARN ' + learnSpell.actionId);
        console.error("learnSpell tomeIndex: " + learnSpell.tomeIndex);
    }
    else {
        console.log('REST'); // what's a different between REST and WAIT?
    }
    // debug
    console.error("=========");
    console.error("afordableOrders: " + afordableOrders.length);
    console.error("spellsAvailable: " + spells.length);
    console.error("afordableSpells: " + afordableSpells.map(function (spell) { return spell.actionId; }));
    console.error("myInventoryDelta: " + userData[0].inventoryDelta);
    console.error("castableSpells: " + castableSpells.map(function (spell) { return spell.actionId; }));
    console.error("LearnSpells: " + learnSpells.length);
    console.error("repeatable: " + castableSpells.filter(function (spell) { return spell.repeatable; }).map(function (spell) { return spell.actionId; }));
    console.error("spellToCast: " + spellToCast);
    console.error("=========");
}
