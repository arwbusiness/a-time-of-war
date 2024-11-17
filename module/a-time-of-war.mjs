// Import document classes.
import { BTActor } from './documents/actor.mjs';
import { BTItem } from './documents/item.mjs';
// Import sheet classes.
import { BTPersonActorSheet } from './sheets/bt-personactor-sheet.mjs';
import { BTVehicleActorSheet } from './sheets/bt-vehicleactor-sheet.mjs';
import { BTPersonItemSheet } from './sheets/bt-personitem-sheet.mjs';
import { BTVehicleItemSheet } from './sheets/bt-vehicleitem-sheet.mjs';
import { BTPropertySheet } from './sheets/bt-property-sheet.mjs';

// Import helper/utility classes and constants.
import { preloadHandlebarsTemplates } from './helpers/templates.mjs';
import { BT } from './helpers/config.mjs';

/* -------------------------------------------- */
/*  Init Hook                                   */
/* -------------------------------------------- */

Hooks.once('init', function () {
  // Add utility classes to the global game object so that they're more easily
  // accessible in global contexts.
  game.bt = {
    BTActor,
    BTItem,
    rollItemMacro,
  };

  // Add custom constants for configuration.
  CONFIG.BT = BT;
  Roll.CHAT_TEMPLATE = "systems/a-time-of-war/templates/roll/roll.hbs";

  /**
   * Set an initiative formula for the system
   * @type {String}
   */
  CONFIG.Combat.initiative = {
    formula: '2d6'//,
    //decimals: 0,
  };

  // Define custom Document classes
  CONFIG.Actor.documentClass = BTActor;
  CONFIG.Item.documentClass = BTItem;

  // Active Effects are never copied to the Actor,
  // but will still apply to the Actor from within the Item
  // if the transfer property on the Active Effect is true.
  CONFIG.ActiveEffect.legacyTransferral = false;

  // Register sheet application classes
  Actors.unregisterSheet('core', ActorSheet);
  Actors.registerSheet('bt', BTPersonActorSheet, {
    types: ["pc", "npc"],
    makeDefault: true,
    label: 'BT.SheetLabels.PersonActor', //found in lang/en.json
  });
  Actors.registerSheet('bt', BTVehicleActorSheet, {
    types: ["vehicle"],
    makeDefault: true,
    label: 'BT.SheetLabels.VehicleActor',
  });
  Items.unregisterSheet('core', ItemSheet);
  Items.registerSheet('bt', BTPersonItemSheet, {
    types: ["weapon", "armour", "equipment"],
    makeDefault: true,
    label: 'BT.SheetLabels.PersonItem',
  });
  Items.unregisterSheet('core', ItemSheet);
  Items.registerSheet('bt', BTVehicleItemSheet, {
    types: ["vehicle_weapon", "vehicle_equipment"],
    makeDefault: true,
    label: 'BT.SheetLabels.VehicleItem',
  });
  Items.registerSheet('bt', BTPropertySheet, {
    types: ["property"],
    makeDefault: true,
    label: 'BT.SheetLabels.Property',
  });

  // Preload Handlebars templates.
  return preloadHandlebarsTemplates();
});

/* -------------------------------------------- */
/*  Handlebars Helpers                          */
/* -------------------------------------------- */

// If you need to add Handlebars helpers, here is a useful example:
Handlebars.registerHelper('toLowerCase', function(str) {
  return str.toLowerCase();
});

Handlebars.registerHelper('toUpperCase', function(str) {
	return str.toUpperCase();
});

Handlebars.registerHelper('toUpperCaseNested', function(array, value) {
	return str.toUpperCase(array[value]);
});

Handlebars.registerHelper('toLowerCaseNested', function(array, value) {
	return str.toLowerCase(array[value]);
});

Handlebars.registerHelper('in', function(key, ...list) {
	return list.includes(key);
});
//toLowerCaseNested 

Handlebars.registerHelper('eq', (a, b) => a == b);
Handlebars.registerHelper('le', (a, b) => a <= b);
Handlebars.registerHelper('lt', (a, b) => a < b);
Handlebars.registerHelper('ge', (a, b) => a >= b);
Handlebars.registerHelper('gt', (a, b) => a > b);

/*Handlebars.registerHelper('ifEqual', function (a, b, options) {
    if (a == b) { return options.fn(this); }
    return options.inverse(this);
});*/

/* -------------------------------------------- */
/*  Ready Hook                                  */
/* -------------------------------------------- */

Hooks.once('ready', function () {
  // Wait to register hotbar drop hook on ready so that modules could register earlier if they want to
  Hooks.on('hotbarDrop', (bar, data, slot) => createItemMacro(data, slot));
});

Hooks.once('setup', function () {
	_configureTrackableAttributes();
});

//Hooks.on('renderCustomActorSheet', function (app, html, data) {
//Hooks.on("renderItemSheet",function(app,_html)
/*Hooks.on("updateActor", function (system="a-time-of-war") {
	console.log("HEY");
});*/

/*Hooks.on('renderCustomActorSheet', function (app, html, data) {
	console.log(data);
});*/

function _configureTrackableAttributes() {
	const person = {
		bar: ["damage", "fatigue"],
		value: []
	};
	
	CONFIG.Actor.trackableAttributes = {
		"pc": {
			bar: [...person.bar, "luck"],
			value: []
		},
		"npc": {
			bar: [...person.bar],
			value: []
		},
		"vehicle": {
			bar: [],
			value: ["mp.walk", "mp.run", "mp.jump"]
		}
	};
}

/* -------------------------------------------- */
/*  Hotbar Macros                               */
/* -------------------------------------------- */

/**
 * Create a Macro from an Item drop.
 * Get an existing item macro if one exists, otherwise create a new one.
 * @param {Object} data     The dropped data
 * @param {number} slot     The hotbar slot to use
 * @returns {Promise}
 */
async function createItemMacro(data, slot) {
  // First, determine if this is a valid owned item.
  if (data.type !== 'Item') return;
  if (!data.uuid.includes('Actor.') && !data.uuid.includes('Token.')) {
    return ui.notifications.warn(
      'You can only create macro buttons for owned Items'
    );
  }
  // If it is, retrieve it based on the uuid.
  const item = await Item.fromDropData(data);

  // Create the macro command using the uuid.
  const command = `game.bt.rollItemMacro("${data.uuid}");`;
  let macro = game.macros.find(
    (m) => m.name === item.name && m.command === command
  );
  if (!macro) {
    macro = await Macro.create({
      name: item.name,
      type: 'script',
      img: item.img,
      command: command,
      flags: { 'bt.itemMacro': true },
    });
  }
  game.user.assignHotbarMacro(macro, slot);
  return false;
}

/**
 * Create a Macro from an Item drop.
 * Get an existing item macro if one exists, otherwise create a new one.
 * @param {string} itemUuid
 */
function rollItemMacro(itemUuid) {
  // Reconstruct the drop data so that we can load the item.
  const dropData = {
    type: 'Item',
    uuid: itemUuid,
  };
  // Load the item from the uuid.
  Item.fromDropData(dropData).then((item) => {
    // Determine if the item loaded and if it's an owned item.
    if (!item || !item.parent) {
      const itemName = item?.name ?? itemUuid;
      return ui.notifications.warn(
        `Could not find item ${itemName}. You may need to delete and recreate this macro.`
      );
    }

    // Trigger the item roll
    item.roll();
  });
}

function roll() {
	
}