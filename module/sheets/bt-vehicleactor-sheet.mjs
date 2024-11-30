import {
  onManageActiveEffect,
  prepareActiveEffectCategories,
} from '../helpers/effects.mjs';

/**
 * Extend the basic ActorSheet with some very simple modifications
 * @extends {ActorSheet}
 */
export class BTVehicleActorSheet extends ActorSheet {
  /** @override */
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ['bt', 'sheet', 'actor', 'vehicle'],
      width: 750,
      height: 650,
      tabs: [
        {
          navSelector: '.sheet-tabs',
          contentSelector: '.sheet-body',
          initial: 'gameplay',
        },
      ],
    });
  }

	/** @override */
	get template() {
		return `systems/a-time-of-war/templates/actor/VehicleActorSheet.hbs`;
	}

	async _onDropActor(event, data) {
		const element = event.target;

		//You missed.
		//if(!event.target.classList.contains("droppable-actors"))
		//  return;

		//Get the information we need to fetch stats from the dropped actor.
		const uuid = data.uuid.split(".")[1];
		const actor = game.actors.get(uuid);
		
		//Let's see if this element has a real/fake act going on.
		let split = element.id.split("-");
		let real = element;
		let fake = null;
		let fakeImg = null;
		if(split[split.length-1] == "real" || split[split.length-1] == "fake") {
			console.log("HEY!")
			split = split.slice(0, split.length-1);
			let str = "";
			split.forEach(s => { str += s + "-"; });
			real = document.getElementById(str+"real");
			fake = document.getElementById(str+"fake");
			fakeImg = document.getElementById(str+"fake-img");
		}
		console.log("Real: {0}", real);
		if(fake != null)
			console.log("Fake: {0}", fake);
		if(fakeImg != null)
			console.log("FakeImg: {0}", fakeImg);
		
		if(real != null && fake != null) {
			real.style.display = "none";
			fake.style.display = "block";
			real.value = uuid;
			fake.value = actor.name;
			if(fakeImg != null) {
				fakeImg.style.display = "block";
				fakeImg.src = actor.img;
			}
		}
		
		//Time to start actually processing data.
		const vehicle = this.actor.system;
		if(element.classList.contains("pilot-uuid")) {
			this.UpdatePilot(uuid);
		}

		//Live and let live--continue the cycle.
		super._onDropActor(event, data);
	}
	
	//await _onDropActor({ target: target }, { uuid: uuid });
	//target is an element
	//uuid should be obvious, but it's an actor uuid
	/*FakeDropActor(target, uuid) {
		const ev = {
			target: target
		};
		const dt = {
			uuid: uuid
		}
		
		await _onDropActor(ev, dt);
	}*/
	
	UpdatePilot(uuid) {
		const vehicle = this.actor.system;
		const pilot = game.actors.get(uuid);
		const skills = pilot.system.skills;
		
		const driveTypes = ['ground','rail','sea'];
		const gunneryTypes = ['aerospace','air','battlesuit','ground','mech','sea','spacecraft','turret'];
		const gunnery = gunneryTypes.includes(vehicle.type) ? skills["gunnery_"+vehicle.type].level : skills["gunnery_turret"].level;
		const piloting = driveTypes.includes(vehicle.type) ? skills["driving_"+vehicle.type].level : skills["piloting_"+vehicle.type].level;
		const perception = skills["perception"].level;
		const sensorops = skills["sensorops"].level;
		const computers = skills["computers"].level;
		const comms = skills["comms_conventional"].level;
		
		let updateData = {};
		updateData["system.pilot"] = uuid;
		updateData["system.pilot_skills"] = {
			gunnery: gunnery,
			piloting: piloting,
			perception: perception,
			sensorops: sensorops,
			computers: computers,
			comms: comms
		}
		//console.log(updateData);
		
		this.actor.update(updateData);
	}

  /* -------------------------------------------- */

	/** @override */
	async getData() {
		// Retrieve the data structure from the base sheet. You can inspect or log
		// the context variable to see the structure, but some key properties for
		// sheets are the actor object, the data object, whether or not it's
		// editable, the items array, and the effects array.
		const context = super.getData();

		// Use a safe clone of the actor data for further operations.
		const actorData = this.document.toObject(false);
		const systemData = actorData.system;

		// Add the actor's data to context.data for easier access, as well as flags.
		context.system = actorData.system;
		context.flags = actorData.flags;

		// Adding a pointer to CONFIG.BOILERPLATE
		context.config = CONFIG.BT;

		// Prepare character data and items.
		//this._prepareItems(context);
		this.PrepareDerivedData(actorData, systemData);

		// Prepare active effects
		context.effects = prepareActiveEffectCategories(
		// A generator that returns all effects stored on the actor
		// as well as any items
			this.actor.allApplicableEffects()
		);

		return context;
	}
	
	PrepareDerivedData(actorData, systemData) {
		
	}

  /**
   * Organize and classify Items for Actor sheets.
   *
   * @param {object} context The context object to mutate
   */
  _prepareItems(context) {
    // Initialize containers.
    const gear = [];
    const features = [];
    const spells = {
      0: [],
      1: [],
      2: [],
      3: [],
      4: [],
      5: [],
      6: [],
      7: [],
      8: [],
      9: [],
    };

    // Iterate through items, allocating to containers
    for (let i of context.items) {
      i.img = i.img || Item.DEFAULT_ICON;
      // Append to gear.
      if (i.type === 'item') {
        gear.push(i);
      }
      // Append to features.
      else if (i.type === 'feature') {
        features.push(i);
      }
      // Append to spells.
      else if (i.type === 'spell') {
        if (i.system.spellLevel != undefined) {
          spells[i.system.spellLevel].push(i);
        }
      }
    }

    // Assign and return
    context.gear = gear;
    context.features = features;
    context.spells = spells;
  }

  /* -------------------------------------------- */

  /** @override */
  activateListeners(html) {
    super.activateListeners(html);
	
	this.ActivateSheetListeners(html);

    // Render the item sheet for viewing/editing prior to the editable check.
    /*html.on('click', '.item-edit', (ev) => {
      const li = $(ev.currentTarget).parents('.item');
      const item = this.actor.items.get(li.data('itemId'));
      item.sheet.render(true);
    });

    // -------------------------------------------------------------
    // Everything below here is only needed if the sheet is editable
    if (!this.isEditable) return;

    // Add Inventory Item
    html.on('click', '.item-create', this._onItemCreate.bind(this));

    // Delete Inventory Item
    html.on('click', '.item-delete', (ev) => {
      const li = $(ev.currentTarget).parents('.item');
      const item = this.actor.items.get(li.data('itemId'));
      item.delete();
      li.slideUp(200, () => this.render(false));
    });

    // Active Effect management
    html.on('click', '.effect-control', (ev) => {
      const row = ev.currentTarget.closest('li');
      const document =
        row.dataset.parentId === this.actor.id
          ? this.actor
          : this.actor.items.get(row.dataset.parentId);
      onManageActiveEffect(ev, document);
    });

    // Drag events for macros.
    if (this.actor.isOwner) {
      let handler = (ev) => this._onDragStart(ev);
      html.find('li.item').each((i, li) => {
        if (li.classList.contains('inventory-header')) return;
        li.setAttribute('draggable', true);
        li.addEventListener('dragstart', handler, false);
      });
    }*/
  }
  
	ActivateSheetListeners(html) {
		const actorData = this.document.toObject(false);
		const systemData = actorData.system;

		// Rollable abilities.
		html.on('click', '.rollable', this._onRoll.bind(this));
		
		//Bind buttons and stuff.
		html.on('change', '#vehicle-type', this.ChangeVehicleType.bind(this));
		html.on('dblclick', '#pilot-fake', this.TogglePilotSheet.bind(this));
		
		//Check the pilot id, update with the current version of the actor if found and hide the real pilot elements.
		this.RefreshPilot(html, actorData, systemData);
		html.on('click', '#refresh-pilot', this.RefreshPilotManual.bind(this));
		html.on('click', '#delete-pilot', this.DeletePilot.bind(this));
		
		//Try to make the lists default pick the thing they're supposed to, because they just default to the first option in the list otherwise.
		let typeList = document.getElementById("vehicle-type");
		switch(systemData.type) {
			case "ground":
				typeList.selectedIndex = 0;
				break;
			case "rail":
				typeList.selectedIndex = 1;
				break;
			case "sea":
				typeList.selectedIndex = 2;
				break;
			case "aerospace":
				typeList.selectedIndex = 3;
				break;
			case "air":
				typeList.selectedIndex = 4;
				break;
			case "battlesuit":
				typeList.selectedIndex = 5;
				break;
			case "mech":
				typeList.selectedIndex = 6;
				break;
			case "spacecraft":
				typeList.selectedIndex = 7;
				break;
			default:
				break;
		}
	
		//Update the class based on tonnage
		//This will need reworking to accommodate non-mech vehicles, which don't use these brackets to determine their light/medium/heavy/superheavy class.
		const weight = systemData.tonnage;
		let updateData = {};
		updateData["system.details.class"] = weight <= 35 ? "Light" : weight <= 55 ? "Medium" : weight <= 75 ? "Heavy" : "Assault";
		this.actor.update(updateData);
		
		//Prep heat.
		let heat = systemData.stats.heat;
		if(heat > 1) {
			for(var i = 29; i >= 30-heat; i--) {
				let hex = parseInt((256/30) * (i)).toString(16);
				let colour = "#ff" + (hex < 10 ? "0" : "") + hex + "00";
				const elem = document.getElementById("heat-"+i);
				elem.style.backgroundColor = colour;
			}
		}
		
		//Prep armour and structure circles with their bound listeners.
		html.on('click', '.circle-armour', this.ToggleArmourCircle.bind(this));
		html.on('click', '.circle-structure', this.ToggleArmourCircle.bind(this));
	}
	
	ChangeVehicleType(event) {
		const element = event.currentTarget;
		const value = element.value;
		
		let updateData = {};
		updateData["system.type"] = value;
		this.actor.update(updateData);
	}
	
	//Opens the pilot's character sheet, if any.
	TogglePilotSheet(event) {
		const element = document.getElementById("pilot-real");
		const value = element.value;
		
		const pilot = game.actors.get(value);
		if(pilot != undefined && pilot != "");
			pilot.sheet.render(true);
	}
	
	RefreshPilotManual(event) {
		const actorData = this.document.toObject(false);
		const systemData = actorData.system;
		this.RefreshPilot(null, actorData, systemData);
	}
	
	DeletePilot(event) {
		let updateData = {};
		updateData["system.pilot"] = "";
		updateData["system.pilot_skills"] = {
			piloting: 3,
			gunnery: 4,
			comms: 2,
			computers: 2,
			perception: 3,
			sensorops: 3
		};
		
		this.actor.update(updateData);
	}
	
	RefreshPilot(html, actorData, systemData) {
		const pilot = game.actors.get(systemData.pilot);
		if(pilot == undefined || pilot == "") {
			this.DeletePilot({});
			return;
		}
		
		let real = null;
		let fake = null;
		if(html != null) {
			const list = Object.entries(html[0]);
			list.forEach(elem => {
				const id = elem[1].id;
				if(id == "pilot-real")
					real = elem[1];
				if(id == "pilot-fake")
					fake = elem[1];
			});
		}
		else {
			real = document.getElementById("pilot-real");
			fake = document.getElementById("pilot-fake");
		}
		
		if(real.value != undefined && real.value != "") {
			const pilotActor = game.actors.get(real.value);
			
			real.style.display = "none";
			fake.style.display = "block";
			fake.value = pilotActor.name;
			this.UpdatePilot(real.value);
			
			const img = document.getElementById("pilot-fake-img");
			img.style.display = "block";
			img.src = pilotActor.img;
		}
	}

	ToggleArmourCircle(event) {
		const element = event.currentTarget;
		
		const actorData = this.document.toObject(false);
		const systemData = actorData.system;
		
		const split = element.dataset.for.split('-');
		if(split[0] != systemData.type)
		{
			console.error("circle type {0} does not match vehicle type {1}!", type, systemData.type);
			return;
		}
		const location = split[1];
		const type = split[2];
		console.log("Clicked circle is {0}-{1}-{2}-{3}", systemData.type, location, type);
		
		let updateData = {};
		const state = element.classList.contains("circle-filled-" + type) && !element.classList.contains("circle-blank-" + type) ? "destroyed" : "intact";
		const value = systemData.locations[split[0]][location][type].value;
		
		updateData["system.locations."+systemData.type+"."+location+"."+type+".value"] = value + (state == "intact" ? -1 : +1);
		
		this.actor.update(updateData);
	}

  /**
   * Handle creating a new Owned Item for the actor using initial data defined in the HTML dataset
   * @param {Event} event   The originating click event
   * @private
   */
  /*async _onItemCreate(event) {
    event.preventDefault();
    const header = event.currentTarget;
    // Get the type of item to create.
    const type = header.dataset.type;
    // Grab any data associated with this control.
    const data = duplicate(header.dataset);
    // Initialize a default name.
    const name = `New ${type.capitalize()}`;
    // Prepare the item object.
    const itemData = {
      name: name,
      type: type,
      system: data,
    };
    // Remove the type from the dataset since it's in the itemData.type prop.
    delete itemData.system['type'];

    // Finally, create the item!
    return await Item.create(itemData, { parent: this.actor });
  }*/

	/**
	* Handle clickable rolls.
	* @param {Event} event   The originating click event
	* @private
	*/
	_onRoll(event) {
		event.preventDefault();
		const ev = event;
		const element = event.currentTarget;
		const dataset = element.dataset;
		console.log("rollEvent: {0}", ev);
		
		const request = dataset.for;
		
		switch(dataset.rolltype) {
			case "skill":
				return this.RollSkill(request);
			case "vehicle_weapon":
				return this.RollAttack(request);
			case "critical":
				return this.RollCriticalSlot(request);
			default:
				console.error("RollType {0} was not recognised!", dataset.rolltype);
				return null;
		}
	}
	
	async RollSkill(which) {
		if(which == undefined) {
			console.error("Expected a string skill name; got undefined");
			return;
		}
		
		const actorData = this.actor;
		const systemData = actorData.system;
		const rollData = actorData.getRollData();
		
		const hasPilot = systemData.pilot != undefined && systemData.pilot != "";
		const pilotData = game.actors.get(systemData.pilot);
		
		const skill = systemData.pilot_skills[which];
		const untrained = skill == -1;
		let tn = untrained ? (('piloting','gunnery','sensorops').includes(which) ? 18 : 12) : 8;
		
		//Special case for vehicles, there's some weirdness with the naming conventions that needs to be solved and it's easier to do it manually.
		let name = "";
		if(which == "gunnery" && systemData.type == "rail")
			name = "gunnery_turret";
		else if(which == "piloting" && (systemData.type == "ground" || systemData.type == "rail" || systemData.type == "sea"))
			name = "driving_" + systemData.type;
		else if(which == "piloting" || which == "gunnery")
			name = which + "_" + systemData.type;
		else if(which == "comms")
			name = "comms_conventional";
		else
			name = which;
		
		//NaturalAptitude calcs
		const neededTP = ('piloting','gunnery','sensorops','computers').includes(which) ? 5 : 3;
		let traitLevel = 0;
		Object.entries(pilotData.system.traits).forEach(entry => {
			const trait = entry[1];
			const traitName = trait.name;
			const subtitle = trait.subtitle;
			const level = trait.level;
			
			if(traitName == "natural_aptitude") {
				let subname = subtitle.replace("/","_").replace("'","").replace(" ","_").toLowerCase();
				if(subname == name) {
					traitLevel = level >= traitLevel ? level : traitLevel;
				}
			}
		});
		const hasNaturalAptitude = traitLevel >= neededTP;
		
		//Build the roll manually because we can't have nice things.
		let dice = {};
		let num = hasNaturalAptitude ? 3 : 2;
		let lowest = hasNaturalAptitude ? 7 : 0;
		let lowestIndex = 0;
		let total = 0;
		let sixes = 0;
		for(var i = 0; i < num; i++) {
			let roll = await new Roll('1d6', rollData).evaluate();
			const value = roll.dice[0].results[0].result;
			dice[i] = value;
			total += value;
				
			//Calculate the index and value of the lowest die roll
			if(value < lowest) {
				lowestIndex = i;
				lowest = value;
			}
			
			//If you get two 6s, it explodes and further 6s explode; ergo while you're on 2d6, a 12 explodes, but while you're on 3d6, an 18 (6+6+6) would explode.
			if(value == 6 && sixes < 5) {
				sixes++;
				console.log(sixes);
				if(sixes >= 2)
					num++;
			}
		}
		const isStunning = sixes >= 2;
		const isFumble = total == 2;
		
		//If the pilot has natural aptitude, drop the lowest die and record the value.
		if(hasNaturalAptitude)
			total -= dice[lowestIndex];
		else
			lowestIndex = -1;
		
		//Add skill or attribute bonus to the total.
		let linkMod = 0;
		total += untrained ? linkMod : skill;
		
		//Let modifiers kick in.
		let modifiers = {};
		Object.entries(modifiers).forEach(entry => {
			let modifier = entry[1];
			console.log(modifier);
			//total += modifier;
		});
		
		//Calculate the MoS/F:
		const margin = (total >= tn ? "+" : "") + (total - tn);
		
		//Establish the message data.
		let msgData = {
			name: name,
			dice: dice,
			lowest: lowestIndex,
			rollMod: skill,
			speaker: (hasPilot ? pilotData.name : actorData.name),
			untrained: untrained,
			tn: tn,
			actionType: "SA",
			rollType: "skill",
			img: (hasPilot ? pilotData.img : actorData.img),
			baseSkill: "none",
			result: total,
			margin: (isFumble ? (total-tn > -10 ? "-10" : margin) : (isStunning ? (total-tn < 10 ? "+10" : margin) : margin)),
			isSuccess: (total >= tn && !isFumble) || isStunning,
			successOrFail: (!isFumble && !isStunning ? (margin < 0 ? "Failed" : "Succeeded") : isStunning ? "Succeeded" : "Failed"),
			isFumble: isFumble,
			isStunning: isStunning
		}
		//Apply the chat roll mode.
		msgData = ChatMessage.applyRollMode(msgData, game.settings.get("core", "rollMode"));
		
		//Render the message and send it to the chat window.
		const render = await renderTemplate("systems/a-time-of-war/templates/chat/StatRoll.hbs", msgData);
		const msg = await ChatMessage.create({
			content: render,
			sound: CONFIG.sounds.dice
		});
		
		return msg;
	}
	
	async RollAttack(id) {
		if(id == undefined) {
			console.error("Expected an attack weapon id or lpunch, rpunch, kick; got undefined");
			return;
		}
		
		if(id == "lpunch" || id == "rpunch" || id == "kick") {
			//special handling
		}
		console.log("requested weapon id: {0}", id);
		
		//some kind of attack type submenu goes here, at the end
		//this.RollSkill("gunnery");
		//this.RollSkill("piloting");
	}
	
	async TakeDamage(damage, facing) {
		let type = this.actor.system.type;
		if (type != "mech")
		{
			console.error("Haven't implemented anything for non-mechs yet.");
			return null;
		}
		
		const location = await this.RandomLocation(type, facing);
		console.log(this.actor.system.locations);
		console.log(this.actor.system.locations[type]);
		console.log(this.actor.system.locations[type][location]);
		console.log(this.actor.system.locations[type][location].armour);
		console.log(this.actor.system.locations[type][location].armour.value);
		const armour = parseInt(this.actor.system.locations[type][location].armour.value);
		let structure = 0;
		switch(location) {
			case "rear_l":
				structure = this.actor.system.locations[type]["torso_l"].structure.value;
				break;
			case "rear_c":
				structure = this.actor.system.locations[type]["torso_c"].structure.value;
				break;
			case "rear_r":
				structure = this.actor.system.locations[type]["torso_r"].structure.value;
				break;
			default:
				structure = this.actor.system.locations[type][location].structure.value;
		}
		
		let updateData = {};
		let hasCrit = false;
		let remainder = 0;
		
		if(armour - damage < 0) {
			remainer = damage - armour;
			hasCrit = true;
			updateData["system.locations.mech." + location + ".armour.value"] = 0;
			updateData["system.locations.mech." + location + ".structure.value"] = remainder > structure ? 0 : parseInt(structure - remainder);
			RollCriticalSlot(location, "both");
		}
		else {
			updateData["system.locations.mech." + location + ".armour.value"] = parseInt(armour - damage);
		}
		
		console.log(updateData);
		this.actor.update(updateData);
	}
	
	async RandomLocation(type, facing) {
		if(type != "mech") {
			console.error("Haven't implemented any random location tables for non-mechs yet :(");
			return null;
		}
		
		const dice = await new Roll('2d6', {}).evaluate();
		const roll = dice._total;
		if(facing == "left") {
			switch(roll) {
				case 2:
					this.RollCriticalSlot("torso_l", "both");
				case 7:
					return "torso_l";
				case 3:
				case 6:
					return "leg_l";
				case 4:
				case 5:
					return "arm_l";
				case 8:
					return "torso_c";
				case 9:
					return "torso_r";
				case 10:
					return "arm_r";
				case 11:
					return "leg_r";
				case 12:
					return "head";
				default:
					console.error("Something bad happened, {0} isn't on the hit chart", roll);
					return null;
			}
		}
		else if(facing == "right") {
			switch(roll) {
				case 2:
					this.RollCriticalSlot("torso_r", "both");
				case 7:
					return "torso_r";
				case 3:
				case 6:
					return "leg_r";
				case 4:
				case 5:
					return "arm_r";
				case 8:
					return "torso_c";
				case 9:
					return "torso_l";
				case 10:
					return "arm_l";
				case 11:
					return "leg_l";
				case 12:
					return "head";
				default:
					console.error("Something bad happened, {0} isn't on the hit chart", roll);
					return null;
			}
		}
		else if(facing == "front") {
			switch(roll) {
				case 2:
					this.RollCriticalSlot("torso_c", "both");
				case 7:
					return "torso_c";
				case 3:
				case 4:
					return "arm_r";
				case 5:
					return "leg_r";
				case 6:
					return "torso_r";
				case 8:
					return "torso_l";
				case 9:
					return "leg_l";
				case 10:
				case 11:
					return "arm_l";
				case 12:
					return "head";
				default:
					console.error("Something bad happened, {0} isn't on the hit chart", roll);
					return null;
			}
		}
		else if(facing == "rear") {
			switch(roll) {
				case 2:
					this.RollCriticalSlot("torso_c", "both");
				case 7:
					return "rear_c";
				case 3:
				case 4:
					return "arm_r";
				case 5:
					return "leg_r";
				case 6:
					return "rear_r";
				case 8:
					return "rear_l";
				case 9:
					return "leg_l";
				case 10:
				case 11:
					return "arm_l";
				case 12:
					return "head";
				default:
					console.error("Something bad happened, {0} isn't on the hit chart", roll);
					return null;
			}
		}
	}
	
	RollCriticalSlot(location, destroy = "message") {
		if(location == undefined || location == null || location == "") {
			console.error("Expected an string vehicle location; got undefined");
			return;
		}
		
		//destroy is "message" by default so you can roll a random crit slot on your mech for fidgeting purposes
		
		const actorData = this.actor;
		const systemData = actorData.system;
		
		//If destroy is only "destroy" or "message", do the respective; if destroy is "both", do both in the correct order to produce a valid return value
		if(destroy == "destroy" || destroy == "both") {
			//let updateData = {};
			//updateData["system.items[" + hitId + "]".status"] = "destroyed";
			//this.actor.update(updateData);
		}
		if (destroy == "message") {
			//produce a chat message
			//return msg;
		}
	}
}
