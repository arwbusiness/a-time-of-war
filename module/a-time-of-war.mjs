// Import document classes.
import { BTActor } from './documents/actor.mjs';
import { BTItem } from './documents/item.mjs';
import { BTToken } from './documents/token.mjs';
// Import sheet classes.
import { BTPersonActorSheet } from './sheets/bt-personactor-sheet.mjs';
import { BTVehicleActorSheet } from './sheets/bt-vehicleactor-sheet.mjs';
import { BTPersonItemSheet } from './sheets/bt-personitem-sheet.mjs';
import { BTVehicleItemSheet } from './sheets/bt-vehicleitem-sheet.mjs';
import { BTLifepathModuleItemSheet } from './sheets/bt-lifepathmoduleitem-sheet.mjs';
import { BTPropertySheet } from './sheets/bt-property-sheet.mjs';
// Import combat engine stuff.
import { BTCombatTracker } from "./ui/combat-tracker.mjs";
import { BTCombatTrackerConfig } from "./sheets/bt-combat-config-sheet.mjs";
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
    BTItem
  };

  // Add custom constants for configuration.
  CONFIG.BT = BT;
  //Roll.CHAT_TEMPLATE = "systems/a-time-of-war/templates/roll/roll.hbs";

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
  CONFIG.Token.objectClass = BTToken;
  CONFIG.ui.combat = BTCombatTracker;

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
  Items.registerSheet('bt', BTLifepathModuleItemSheet, {
    types: ["lifepath_module"],
    makeDefault: true,
    label: 'BT.SheetLabels.LifepathModule',
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

//String in list
Handlebars.registerHelper('in', function(key, ...list) {
	return list.includes(key);
});

//Operator helpers
Handlebars.registerHelper('eq', (a, b) => a == b);
Handlebars.registerHelper('le', (a, b) => a <= b);
Handlebars.registerHelper('lt', (a, b) => a < b);
Handlebars.registerHelper('ge', (a, b) => a >= b);
Handlebars.registerHelper('gt', (a, b) => a > b);
Handlebars.registerHelper('plus', (a, b) => a + b);
Handlebars.registerHelper('minus', (a, b) => a - b);
Handlebars.registerHelper('times', (a, b) => a * b);
Handlebars.registerHelper('divide', (a, b) => a / b);

//Capitalisation helper
Handlebars.registerHelper('cap', function(key) {
	if(key.split(" ").length <= 1) {
		//Normal, no spaces, just capitalise the string.
		return key.slice(0,1).toUpperCase() + key.slice(1).toLowerCase();
	}
	else {
		//It has spaces, capitalise each word.
		let temp = key.split(" ");
		let tempKet = "";
		let i = 0;
		temp.forEach(str => {
			tempKey += str.slice(0,1).toUpperCase() + str.slice(1).toLowerCase() + i++ < temp.length ? " " : "";
		});
		return tempKey;
	}
});

//For loop helper
Handlebars.registerHelper('loop', function(n, block) {
    var accum = '';
    for(var i = 0; i < n; ++i) {
        block.data.index = i;
        block.data.first = i === 0;
        block.data.last = i === (n - 1);
		block.data.length = n;
        accum += block.fn(this);
    }
    return accum;
});

//fall-through localise call
Handlebars.registerHelper('tryLocalize', function(key) {
	return game.i18n.localize(key);
});

/* -------------------------------------------- */
/*  Hooks	                                    */
/* -------------------------------------------- */

Hooks.once('setup', function () {
	_configureTrackableAttributes();
	
	CONFIG.statusEffects = [
		{
			id:'dead',
			label:'EFFECT.Status.dead',
			icon:'icons/svg/skull.svg'
		},
		{
			id:'stunned',
			label:'BT.Status.stunned',
			icon:'icons/statusEffects/stunned.png'
		},
		{
			id:'bleeding',
			label:'BT.Status.bleeding',
			icon:'icons/statusEffects/bleeding.png'
		},
		{
			id:'knockdown',
			label:'BT.Status.knockdown',
			icon:'icons/statusEffects/knockdown.png'
		},
		{
			id:'unconscious',
			label:'BT.Status.unconscious',
			icon:'icons/statusEffects/unconscious.png'
		},
		{
			id:'shutdown',
			label:'BT.Status.shutdown',
			icon:'icons/statusEffects/shutdown.png'
		},
		{
			id:'hasActed',
			label:'BT.Status.hasActed',
			icon:'icons/statusEffects/hasActed.png'
		}
	];
});

/**
 * Once the entire VTT framework is initialized, check to see if we should perform a data migration.
 * Small version changes (after the last dot) do not need a migration.
 */
Hooks.once("ready", function() {
	
});

//Hooks.on("renderActor");
//Hooks.on("renderActorDirectory");

//Establish default settings for prototype tokens so I have to do less work.
Hooks.on("preCreateActor", function(document, data, options, userId) {
	console.log("Document:", document);
	
	let updateData = {};
	const target = "prototypeToken.";
	
	updateData[target+"sight.enabled"] = true;
	updateData[target+"sight.range"] = 250;
	
	if(document.type == "pc") {
		updateData[target+"actorLink"] = true;
		updateData[target+"lockRotation"] = true;
	}
	else if(document.type == "vehicle") {
		updateData[target+"lockRotation"] = false;
	}
	else if(document.type == "npc") {
		updateData[target+"lockRotation"] = true;
	}
	
	document.updateSource(updateData);
});

Hooks.on("preCreateCombat", function(document, data, options, userId) {
	console.log(document);
});

Hooks.on('changeSidebarTab', function(app) {
	//We're interested in changing how the combat tab displays stuff, so...
	if(app.id != "combat")
		return;
	
	const element = app._element[0];
	const children = element.children;
});

Hooks.on('renderCombatTracker', function(document,html,data) {
	/*console.log(document);
	console.log(html);
	console.log(data);*/
});

Hooks.on("renderCombatTrackerConfig", async(app, html) => {
	console.log(app);
	
	const data = {
		canConfigure: true
	};
	html = await renderTemplate("systems/a-time-of-war/templates/sheets/combat-config.html", data);
	console.log(html);
	
	html.render(true);
	
	//await super.renderCombatTrackerConfig(app, html);
});
/*Hooks.on("renderCombatTrackerConfig",async(app,$html)=>{
	const html=$html[0],appWindow=htmlClosest(html,"#combat-config");
	appWindow&&(appWindow.style.height="");
	const template2=await(async()=>{
		const markup=await renderTemplate("systems/pf2e/templates/sidebar/encounter-tracker/config.hbs",
		{
			values:{
				deathIcon:game.settings.get("pf2e","deathIcon"),
				actorsDeadAtZero:game.settings.get("pf2e","automation.actorsDeadAtZero"),deadAtZeroOptions:[{
					value:"both",
					label:"PF2E.SETTINGS.Automation.ActorsDeadAtZero.Both"
				},
				{
					value:"npcsOnly",
					label:"PF2E.SETTINGS.Automation.ActorsDeadAtZero.NPCsOnly"
				},
				{
					value:"neither",
					label:"PF2E.SETTINGS.Automation.ActorsDeadAtZero.Neither"
				}]
			}
		}),
		tempElem=document.createElement("div");
		return tempElem.innerHTML=markup, tempElem.firstElementChild instanceof HTMLTemplateElement?tempElem.firstElementChild:null
	})();
	htmlQueryAll(html,".form-group").at(-1)?.after(...template2?.content.children??[]),app.activateListeners($html)
});*/

//Vehicles have some specific phenomena to resolve when their turn starts, so we do it here.
Hooks.on('combatTurnChange', async function(combat, prior, current) {
	//If there's no turns, don't bother trying to do anything and save some lines of code.
	if(combat?.turns)
		return;
	
	/** New combat stuff */
	
	if(settings.isTactical) {
		console.log("In tactical.");
	}
	else {
		console.log("Not in tactical.");
	}
	
	/** */
	
	const currentActorId = combat?.turns[current.turn].actorId;
	if(game.actors.get(currentActorId).type == "vehicle")
	{
		let actor = game.actors.get(currentActorId);
		//Get real actor (could be synthetic) using the token
		let tokenId = current.tokenId;
		let token = canvas.scene.tokens.get(tokenId);
		if(!token.actorLink)
			actor = token.actor;
		
		//Fix heat if it's somehow null.
		let updateData = {};
		if(actor.system.stats.heat == null || actor.system.stats.heat == undefined) {
			updateData["system.stats.heat"] = 0;
			actor.update(updateData);
		}
		
		//Movement mods need to go
		/*updateData = {};
		updateData["system.mods.movement"] = [];
		actor.update(updateData);*/
		
		const items = Object.values(actor.items)[4];
		for(let i in items) {
			const item = actor.items.get(items[i]._id);
			let cooling = item.system.cooling;
			let firedThisTurn = item.system.firedThisTurn;
			
			updateData = {};
			updateData["system.cooling"] = firedThisTurn;
			updateData["system.firedThisTurn"] = false;
			item.update(updateData);
		}
	}
	
	//Some stuff needs to be resolved when you end your turn, rather than when you start it. That happens here.
	const previousActorId = combat.turns[prior.turn].actorId;
	if(game.actors.get(previousActorId).type == "vehicle") {
		let tokenId = prior.tokenId;
		let token = canvas.scene.tokens.get(tokenId);
		let actor = token.actorLink ? game.actors.get(combat.turns[prior.turn].actorId) : token.actor;
	
		//Heat resolution phase.
		let cooling = 5;
		if(actor.system.stats.heatsinks != undefined) {
			cooling = actor.system.stats.heatsinks;
			if(actor.system.stats.heatsinks_double == false || actor.system.stats.heatsinks_double == "false")
				cooling /= 2;
		}
		let updateData = {};
		const newHeat = Math.max(0, actor.system.stats.heat - parseFloat(cooling));
		updateData["system.stats.heat"] = newHeat;
		actor.update(updateData);
		
		//Now check for heat shutdown and ammo cookoff
		if(newHeat >= 14) {
			//At risk of shutdown.
			let tn = 4 + Math.floor((newHeat-14)/2);
			const success = await actor.sheet.RollSkill("computers", null, [ [ "computers", tn ] ]).isSuccess;
			
			if(success) {
				ui.notifications.warn(actor.name + " engages the emergency heat shutdown override on their vehicle.");
				actor.toggleStatusEffect("shutdown", { "active": false });
			}
			else {
				ui.notifications.warn(actor.name + "'s vehicle shuts down due to overheating!");
				actor.toggleStatusEffect("shutdown", { "active": true });
			}
		}
		if(newHeat >= 19) {
			//At risk of ammo cook-off.
		}
	}
});

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
			bar: ["stats.heat"],
			value: ["mp.walk", "mp.run", "mp.jump"]
		}
	};
}