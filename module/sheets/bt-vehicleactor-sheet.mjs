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

		/*// Prepare active effects
		context.effects = prepareActiveEffectCategories(
		// A generator that returns all effects stored on the actor
		// as well as any items
			this.actor.allApplicableEffects()
		);*/
		
		this.SortItemsToInventory(context);

		return context;
	}
	
	PrepareDerivedData(actorData, systemData) {
		
	}
	
	SortItemsToInventory(context = null) {
		const weapons = [];
		const equipment = [];
		
		for(let i of this.actor.items) {
			//Near as I can tell, this lets the item retain its img or use the default icon if it doesn't have one of its own.
			i.img = i.img || Item.DEFAULT_ICON;
			
			switch(i.type) {
				case "vehicle_weapon":
					weapons.push(i);
					break;
				case "vehicle_equipment":
					equipment.push(i);
					break;
				default:
					console.error("Item i {0} type {1} not recognised", i, i.type);
					break;
			}
		}
		
		let inventory = {
			weapons: {},
			equipment: {}
		};
		
		if(context != null) {
			context.inventory = inventory;
			
			context.inventory["weapons"] = weapons;
			context.inventory["equipment"] = equipment;
			
			return null;
		}
		else {
			inventory["weapons"] = weapons;
			inventory["equipment"] = equipment;
			
			return inventory;
		}
	}
	
	/** @override */
	async _onDropItemCreate(itemData) {
		//Forge an array from whatever is in itemData.
		let items = itemData instanceof Array ? itemData : [itemData];
		
		//Initialise an empty array, toCreate, which we'll push into the embedded documents at the end.
		const toCreate = [];
		//For each "item" in the items arrays,
		for (const item of items ) {
			//Call our custom handler function, which tells us if it's ok to drop that item onto the sheet.
			const result = await this.ValidateDroppedItem(item);
			//If we get back a decent result, push that result into the toCreate array!
			if( result )
				toCreate.push(result);
		}
		
		//Push the newly-made items onto the character sheet.
		return this.actor.createEmbeddedDocuments("Item", toCreate);
	}
	
	//Handler to determine if dropped items are valid
	async ValidateDroppedItem(itemData) {
		const valid = ['vehicle_weapon', 'vehicle_equipment'].includes(itemData.type);
		if(!valid) {
			return false;
		}
		else {
			itemData.system.firedThisTurn = false;
			itemData.system.cooling = false;
		}
		console.log(itemData);
		
		return itemData;
	}

	/* -------------------------------------------- */

	/** @override */
	activateListeners(html) {
		super.activateListeners(html);

		this.ActivateSheetListeners(html);
		
		if (!this.isEditable) return;

		// Render the item sheet for viewing/editing prior to the editable check.
		/*html.on('click', '.item-edit', (ev) => {
		  const li = $(ev.currentTarget).parents('.item');
		  const item = this.actor.items.get(li.data('itemId'));
		  item.sheet.render(true);
		});

		// -------------------------------------------------------------
		// Everything below here is only needed if the sheet is editable
		

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
				//let hex = parseInt((256/30) * (Math.floor(i))).toString(16);
				//let hex = parseInt(256/30 * (i).toString(16));
				let hex = parseInt((256/30)*i);
				hex = hex.toString(16);
				let colour = "#ff" + (hex < 10 ? "0" : "") + hex + "00";
				const elem = document.getElementById("heat-"+i);
				elem.style.backgroundColor = colour;
			}
		}
		
		//Prep armour and structure circles with their bound listeners.
		html.on('click', '.circle-armour', this.ToggleArmourCircle.bind(this));
		html.on('click', '.circle-structure', this.ToggleArmourCircle.bind(this));
		
		// Delete Inventory Item
		html.on('click', '.item-delete', (event) => {
			//Recursively look up whichever of the clicked button's various parents has the item class.
			const li = $(event.currentTarget)[0];
			const item = this.actor.items.get(li.id);
			item.delete();
		});
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
				return this.RollAttack(dataset.id);
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
		if(hasPilot) {
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
		}
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
		const isSuccess = (total >= tn && !isFumble) || isStunning;
		
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
			isSuccess: isSuccess,
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
			sound: CONFIG.sounds.dice,
			system: { "isSuccess": isSuccess }
		});
		
		return msg;
	}
	
	async RollAttack(weaponId) {
		let weapon = null;
		if(weaponId == "lpunch" || weaponId == "rpunch" || weaponId == "kick") {
			weapon = {
				"system": {
					"firedThisTurn": false,
					"profile": {
						"damage": weaponId == "kick" ? Math.ceil(this.actor.system.tonnage / 5) : Math.ceil(this.actor.system.tonnage / 10),
						"heat": 0
					}
				}
			};
		}
		else {
			weapon = this.actor.items.get(weaponId);
			if(weapon == null || weapon == undefined) {
				console.error("Expected an attack weapon id or lpunch, rpunch, kick; got null or undefined");
				return;
			}
		}
		
		const targets = game.user.targets;
		const targetToken = targets ? targets.values().next().value : undefined;
		if(targetToken == null || targetToken == undefined) {
			console.error("TargetToken", targetToken, "is null or undefined!");
			ui.notifications.error("You must select a token to target in order to make an attack.");
		}
		const target = game.actors.get(targetToken.actor.id);
		if(target == null || target == undefined) {
			console.error("Target", target, "is null or undefined!");
			ui.notifications.error("You must select a token to target in order to make an attack.");
		}
		
		//some kind of attack type submenu goes here, at the end
		let msg = null;
		if((weaponId == "lpunch" || weaponId == "rpunch" || weaponId == "kick"))
			msg = await this.RollSkill("piloting");
		else
			msg = await this.RollSkill("gunnery");
		
		const isActive = msg != null;
		
		let updateData = {};
		
		//Trigger weapon cooldown at end phase
		if(isActive)
		{
			updateData["system.firedThisTurn"] = true;
			weapon.system.firedThisTurn = true;
			weapon.update(updateData);
			
			//Apply self heat
			//this.actor.system.stats.heat += parseInt(weapon.system.profile.heat);
			updateData = {};
			console.warn(this.actor.system.stats);
			updateData["system.stats.heat"] = parseFloat(this.actor.system.stats.heat) + parseFloat(weapon.system.profile.heat);
			console.warn(this.actor.system.stats);
			this.actor.update(updateData);
			
			const hit = msg.system.isSuccess;
			if(hit) {
				let facing = "front";
				//Do some magic to work out the facing based on relative position of attacker and target.
				
				
				target.TakeDamage(weapon.system.profile.damage, facing);
			}
		}
	}
}
