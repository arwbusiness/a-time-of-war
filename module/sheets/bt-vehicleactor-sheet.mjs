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
        /*{
          navSelector: '.sheet-tabs',
          contentSelector: '.sheet-body',
          initial: 'features',
        },*/
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
		if(!event.target.classList.contains("droppable-actors"))
		  return;

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
		console.log(updateData);
		
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
		/*if(systemData.pilot != undefined && systemData.pilot != null) {
			//this.UpdatePilot(systemData.pilot);
			
			const doc = this.document;
			const sheet = doc._sheet;
			const form = sheet.form;
			console.log(form);
			const real = document.getElementById("pilot-real");
			const fake = document.getElementById("pilot-fake");
			const img = document.getElementById("pilot-fake-img");
			console.log(real);
			if(real != null) {
				console.log("HEY");
				real.style.display = "none";
				fake.style.display = "block";
				img.style.display = "block";
			}
		}*/
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

    // Rollable abilities.
    html.on('click', '.rollable', this._onRoll.bind(this));

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
		//systemData["system.details.class"] = weight <= 35 ? "Light" : weight <= 55 ? "Medium" : weight <= 75 ? "Heavy" : "Assault";
		let updateData = {};
		updateData["system.details.class"] = weight <= 35 ? "Light" : weight <= 55 ? "Medium" : weight <= 75 ? "Heavy" : "Assault";
		this.actor.update(updateData);
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
		const pilot = systemData.pilot;
		if(pilot != undefined && pilot != "") {
			console.log("pilot: {0}", pilot);
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

  /**
   * Handle creating a new Owned Item for the actor using initial data defined in the HTML dataset
   * @param {Event} event   The originating click event
   * @private
   */
  async _onItemCreate(event) {
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
  }

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
		let tn = 8;
		
		console.log("Skill {0} {1} vs TN {2}", which, skill, tn);
		
		let formula = "{2d6+" + skill + "}cs>=" + tn;
		//if(untrained) //THIS STILL NEEDS DOING
		console.log(formula);
		let roll = await new Roll(formula, rollData).evaluate();
		
		let total = skill == -1 ? 0 : skill;
		const results = roll.dice[0].results;
		Object.entries(results).forEach(entry => { total += entry[1].result; });
		const margin = (total >= tn ? "+" : "") + (total - tn);
		
		let msgData = {
			name: which,
			dice1: results[0].result,
			dice2: results[1].result,
			dice3: results[2] ? results[2].result : "",
			rollMod: skill,
			speaker: (hasPilot ? pilotData.name : actorData.name),
			untrained: untrained,
			tn: tn,
			isSuccess: roll.total >= tn,
			successOrFail: margin < 0 ? "FAILED" : "SUCCESS",
			actionType: "SA",
			rollType: "skill",
			result: total,
			margin: margin,
			img: (hasPilot ? pilotData.img : actorData.img),
			baseSkill: "none"
		}
		msgData = ChatMessage.applyRollMode(msgData, game.settings.get("core", "rollMode"));
		
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
	
	async RollCriticalSlot(location, destroy = "message") {
		if(location == undefined) {
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
