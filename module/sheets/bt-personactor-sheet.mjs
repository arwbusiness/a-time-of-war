import {
  onManageActiveEffect,
  prepareActiveEffectCategories,
} from '../helpers/effects.mjs';

/**
 * Extend the basic ActorSheet with some very simple modifications
 * @extends {ActorSheet}
 */
export class BTPersonActorSheet extends ActorSheet {
  /** @override */
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ['bt', 'sheet', 'actor', 'person'],
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

  /* -------------------------------------------- */

  /** @override */
  getData() {
    // Retrieve the data structure from the base sheet. You can inspect or log
    // the context variable to see the structure, but some key properties for
    // sheets are the actor object, the data object, whether or not it's
    // editable, the items array, and the effects array.
    const context = super.getData();

    // Use a safe clone of the actor data for further operations.
    const actorData = this.document.toObject(false);

    // Add the actor's data to context.data for easier access, as well as flags.
    context.system = actorData.system;
    context.flags = actorData.flags;

    // Adding a pointer to CONFIG.BOILERPLATE
    context.config = CONFIG.BT;

    // Prepare character data and items.
    if (actorData.type == 'pc') {
		this._preparePCData(context);
    }

    // Prepare NPC data and items.
    if (actorData.type == 'npc') {
		this._prepareNPCData(context);
    }
	
	this.SortItemsToInventory(context);
	//console.log(context);

    return context;
  }
  
  /** @override */
  /*getData() {
	  const actor = this.actor;
	  const systemData = actor.system;
	  const items = actor.items;
	  const sheetData = {};
	  
	  sheetData.enrichedDescription = await TextEditor.enrichHTML(this.actor.system.description, { secrets: this.actor.isOwner, entities: true });
	  
	  const data = {
		  actor,
		  system: systemData,
		  owner: actor.isOwner,
		  options: this.options,
		  editable: this.isEditable,
		  cssClass: actor.isOwner ? "editable" : "locked",
		  config: CONFIG.BT,
		  rollData: this.actor.getRollData.bind(this.actor),
		  ...sheetData
	  }
	  console.log(data);
	  return data;
  }*/

	/**
	* Character-specific context modifications
	*
	* @param {object} context The context object to mutate
	*/
	_preparePCData(context) {
		// This is where you can enrich character-specific editor fields
		// or setup anything else that's specific to this type

		//this._prepareVariables(context);

		//Calc handlebars
		Handlebars.registerHelper('calcXPForNextSL', function(xp) {
			if(xp >= 570)
				return 0;
			
			let sl = -1;
			let mult = 1;
			for(var l = 20; l < 570; mult++) {
				if(xp < l)
					break;
				else {
					l += (10*mult);
					sl++;
				}
			}
			
			const remainder = l-xp;
			return remainder;
		});
		Handlebars.registerHelper('calcXPForNextTP', function(xp) {
			if(xp == 0)
				return 100;
			
			const level_sub = Math.floor(xp/100); //2 for 299
			const level_over = level_sub + 1;
			const remainder = xp - level_sub * 100 //(299 - 200 = 99)
			
			return 100-remainder;
		});
	}

	/**
	* Character-specific context modifications
	*
	* @param {object} context The context object to mutate
	*/
	_prepareNPCData(context) {
		// This is where you can enrich character-specific editor fields
		// or setup anything else that's specific to this type
	}

	//Organize and classify Items for Actor sheets.
	/*_prepareItems(context) {
		const weapons = [];
		const armour = [];
		const equipment = [];
		const properties = [];
		const modules = [];
		
		for (let i of context.items) {
			//Near as I can tell, this lets the item retain its img or use the default icon if it doesn't have one of its own.
			i.img = i.img || Item.DEFAULT_ICON;
			
			//Now append it to the appropriate array.
			switch(i.type) {
				case "weapon":
					weapons.push(i);
					break;
				case "armour":
					armour.push(i);
					break;
				case "equipment":
					equipment.push(i);
					break;
				case "property":
					properties.push(i);
					break;
				case "lifepath_module":
					modules.push(i);
					break;
				default:
					console.error("Item i {0} type {1} not recognised", i, i.type);
					break;
			}
		}
		
		//Push this data to context so that handlebars can access it.
		context.inventory = { weapons: {}, armour: {}, equipment: {}, properties: {}, modules: {} };
		context.inventory["weapons"] = weapons;
		context.inventory["armour"] = armour;
		context.inventory["equipment"] = equipment;
		context.inventory["properties"] = properties;
		context.inventory["modules"] = modules;
	}*/
	
	SortItemsToInventory(context = null) {
		const weapons = [];
		const armour = [];
		const equipment = [];
		const properties = [];
		const modules = [];
		
		for (let i of this.actor.items) {
			//Near as I can tell, this lets the item retain its img or use the default icon if it doesn't have one of its own.
			i.img = i.img || Item.DEFAULT_ICON;
			
			//Now append it to the appropriate array.
			switch(i.type) {
				case "weapon":
					weapons.push(i);
					break;
				case "armour":
					armour.push(i);
					break;
				case "equipment":
					equipment.push(i);
					break;
				case "property":
					properties.push(i);
					break;
				case "lifepath_module":
					modules.push(i);
					break;
				default:
					console.error("Item i {0} type {1} not recognised", i, i.type);
					break;
			}
		}
		
		let inventory = {
			weapons: {},
			armour: {},
			equipment: {},
			properties: {},
			modules: {}
		};
		
		if(context != null)
		{
			context.inventory = inventory;
			
			context.inventory["weapons"] = weapons;
			context.inventory["armour"] = armour;
			context.inventory["equipment"] = equipment;
			context.inventory["properties"] = properties;
			context.inventory["modules"] = modules;
			
			return null;
		}
		else {
			inventory["weapons"] = weapons;
			inventory["armour"] = armour;
			inventory["equipment"] = equipment;
			inventory["properties"] = properties;
			inventory["modules"] = modules;
			
			return inventory;
		}
	}

	/* -------------------------------------------- */
  
	/*async _onDrop(event) {
		console.log("event: {0}", event);
		const target = event.target;
		const data = event.dataTransfer.items;
		console.log(data);
		
		//Is it an input?
		if(target.classList.contains("droppable-input")) {
			console.log("Congratulations, you hit the target!");
		}
		
		return await super._onDrop(event);
	}*/
	
	/** @override */
	/*async _onDropItem(event, data) {
		const ev = event;
		const dt = data;
		const uuid = dt.uuid.split("Item.")[1];
		console.log("DROP_ITEM | event: {0}, data: {1}", ev, dt);
		
		let item = foundry.utils.deepClone(game.items.get(uuid));
		console.log(item);
		
		const itemData = item.system;
		console.log(itemData);
		this.actor.createEmbeddedDocuments("Item", [itemData]);
		console.log(this.actor);
		
		return await super._onDropItem(ev, dt);
	}*/
	
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
		const inventory = this.SortItemsToInventory();
		
		//When dropping in a new module, if it's one of the ones that needs to be replaced, first delete the existing modules of that type.
		if(itemData.type == "lifepath_module") {
			const type = itemData.system.type;
			switch(type) {
				case "late_childhood":
				case "early_childhood":
				case "subaffiliation":
				case "affiliation":
					const modules = inventory.modules;
					let ids = [];
					let index = 0;
					for (var i = 0; i < modules.length; i++) {
						const module = modules[i];
						const data = module.system;
						if(data.type == type)
							ids[index++] = module.id;
					}
					this.actor.deleteEmbeddedDocuments("Item", ids);
					break;
				case "real_life":
				case "schooling":
					break;
				default:
					console.error("Module type {0} not recognised!", type);
					return false;
			}
		}
		else {
			//Other validation methods go here.
		}
		
		return itemData;
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

		//Live and let live--continue the cycle.
		super._onDropActor(event, data);
	}

  /** @override */
  get template() {
    const data = this.document.toObject(false);
    switch(data.type) {
	  case 'npc':
	    return `systems/a-time-of-war/templates/actor/PersonActorNPCSheet.hbs`;
	  case 'pc':
	  default:
	    return `systems/a-time-of-war/templates/actor/PersonActorPCSheet.hbs`;
	}
  }

  /* -------------------------------------------- */

	/** @override */
	activateListeners(html) {
		super.activateListeners(html);

		// -------------------------------------------------------------
		// Everything below here is only needed if the sheet is editable
		if (!this.isEditable) return;

		//Activate progression listeners
		this.ListenForSheetButtons(html);
		
		this.UpdateAdvanceMaker();

		/*// Active Effect management
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
	
	RefreshSheet() {
		this.document.prepareDerivedData();
		this.render();
	}

	//These listeners make the advance maker work.
	ListenForSheetButtons(html) {
		//fields
		html.on('change', '#lang-primary', this.ChangeLangPrimary.bind(this));
		html.on('change', '#age', this.ChangeAge.bind(this));
		
		// Rollable buttons.
		html.on('click', '.rollable', this._onRoll.bind(this));
		
		//Adding new skills and traits
		html.on('change', '.add-new-skill', this.AddNewSkill.bind(this));
		html.on('click', '#add-new-trait', this.AddNewTrait.bind(this));
		html.on('click', '.delete-trait', this.DeleteTrait.bind(this));
		html.on('change', '.modify-trait-component', this.ModifyTraitComponent.bind(this));
		html.on('click', '.trait-to-chat', this.TraitToChatMessage.bind(this));
		
		//Bind the custom skill delete buttons.
		html.on('click', '.delete-custom-skill', this.DeleteCustomSkill.bind(this));
		
		//Bind the advance delete buttons.
		html.on('click', '.delete-advance', this.DeleteAdvance.bind(this));
		
		//Dual attribute roll button.
		html.on('click', '.dual-attribute-roll', this._onDualAttributeRollToggle.bind(this));
		document.getElementById("dual-attribute-roll").value = "";
		
		//Bind the advance creation sequence.
		html.on('click', '#advance-free', this._onAdvanceFreeToggle.bind(this));
		html.on('change','#advance-type', this._onAdvanceUpdate.bind(this));
		html.on('change','#advance-name', this._onAdvanceUpdate.bind(this));
		html.on('blur','#advance-xp', this._onAdvanceUpdate.bind(this));
		html.on('click', '#advance-finish', this._onAdvanceFinish.bind(this));
		
		//Lifepath stuff
		html.on('change', '#affiliation-select', this.ChangeLifepath.bind(this));
		html.on('change', '#subaffiliation-select', this.ChangeLifepath.bind(this));
		
	//INVENTORY STUFF
		// Render the item sheet for viewing/editing prior to the editable check.
		html.on('click', '.item-edit', (event) => {
			const li = $(event.currentTarget).parents(".item")[0];
			const item = this.actor.items.get(li.dataset.id);
			item.sheet.render(true);
		});

		// Add Inventory Item
		html.on('click', '.item-create', this.CreateNewItem.bind(this));

		// Delete Inventory Item
		html.on('click', '.item-delete', (event) => {
			//Recursively look up whichever of the clicked button's various parents has the item class.
			const li = $(event.currentTarget).parents(".item")[0];
			const item = this.actor.items.get(li.dataset.id);
			item.delete();
		});
	}

	//Handler method for creating new items on the sheet using the "Add New" button instead of drag-and-drop.
	async CreateNewItem(event) {
		const element = event.currentTarget;
		const type = element.id;
		const dataset = element.dataset;
		
		const name = "New " + type;
		const data = {
			model: "",
			equipped: false,
			description: "",
			tonnage: 0,
			ref: "N/A"
		};
		const itemData = {
			name: name,
			type: type,
			system: data
		}
		
		const newItem = await Item.create(itemData, { parent: this.actor });
		return this.actor.items.get(newItem.id).sheet.render(true);
	}
	
	CleanAdvanceMaker() {
		const actorData = this.actor;
		const systemData = actorData.system;
		const advanceMaker = systemData.advanceMaker;
		
		advanceMaker.name = "";
		advanceMaker.type = "";
		advanceMaker.xp = "";
		advanceMaker.free = false;
		advanceMaker.traitId = "";
		advanceMaker.baseSkill = undefined;
		advanceMaker.subtitle = "";
		advanceMaker.id = "";
		
		this.render();
	}
	
	ChangeLifepath(event) {
		const element = event.currentTarget;
		const value = element.value;
		const which = element.id.split('-select')[0];
		
		let updateData = {};
		updateData["system.lifepath."+which] = value;
		
		if(which == "subaffiliation") {
			switch(value) {
				//Major Periphery State
				case "circinus":
				case "magistracy":
				case "marian":
				case "outworlds":
				case "taurian":
				case "aurigan":
					updateData["system.lifepath.img"] = "systems/a-time-of-war/assets/affiliations/"+value+".png";
					break;
				default:
					break;
			}
		}
		else if(which == "affiliation") {
			switch(value) {
				//Great Houses
				case "liao":
				case "kurita":
				case "steiner":
				case "davion":
				case "marik":
					updateData["system.lifepath.img"] = "systems/a-time-of-war/assets/affiliations/"+value+".png";
					break;
				default:
					break;
			}
		}
		
		document.getElementById("lifepath-img").src = "systems/a-time-of-war/assets/affiliations/"+value+".png";
		this.actor.update(updateData);
	}
	
	/*ToggleShowLifepath(event) {
		const element = event.currentTarget;
		const id = element.id;
		const value = element.checked;
		
		if(id.split("-show-")[1] == "selectors") {
			document.getElementById("lifepath-selectors").style.display = value ? "block" : "none";
		}
		else if(id.split("-show-")[1] == "modules") {
			document.getElementById("lifepath-modules").style.display = value ? "block" : "none";
		}
	}*/
	
	ChangeLangPrimary(event) {
		const element = event.currentTarget;
		
		let updateData = {};
		updateData["system.details.lang_primary"] = element.value;
		this.actor.update(updateData);
		this.RefreshSheet();
	}
	
	/*ChangeDetail(event) {
		const element = event.currentTarget;
		const dataset = element.dataset;
		
		let updateData = {};
		if(dataset.for == "height") {
			this.getData().actor.system.details.build = element.value;
			updateData["system.details.build"] = element.value;
		}
		else if(dataset.for == "weight") {
			this.getData().actor.system.details.gender = element.value;
			updateData["system.details.gender"] = element.value;
		}
		this.actor.update(updateData);
	}*/
	
	ChangeAge(event) {
		const element = event.currentTarget;
		console.log(element);
		
		let updateData = {};
		updateData["system.details.age"] = element.value;
		
		//age mods
		const age = updateData["system.details.age"];
		//str
		if(age < 25) {
			updateData["system.agemods.str"] = "+0";
			updateData["system.agemods.bod"] = "+0";
			updateData["system.agemods.dex"] = "+0";
			updateData["system.agemods.rfl"] = "+0";
			updateData["system.agemods.int"] = "+0";
			updateData["system.agemods.wil"] = "+0";
			updateData["system.agemods.cha"] = "+0";
		}
		else if(age >= 25 && age < 31) {
			updateData["system.agemods.str"] = "+100";
			updateData["system.agemods.bod"] = "+100";
			updateData["system.agemods.dex"] = "+0";
			updateData["system.agemods.rfl"] = "+100";
			updateData["system.agemods.int"] = "+100";
			updateData["system.agemods.wil"] = "+100";
			updateData["system.agemods.cha"] = "+50";
		}
		else if(age >= 31 && age < 41) {
			updateData["system.agemods.str"] = "+200";
			updateData["system.agemods.bod"] = "+200";
			updateData["system.agemods.dex"] = "+0";
			updateData["system.agemods.rfl"] = "+0";
			updateData["system.agemods.int"] = "+200";
			updateData["system.agemods.wil"] = "+200";
			updateData["system.agemods.cha"] = "+50";
		}
		else if(age >= 41 && age < 51) {
			updateData["system.agemods.str"] = "+200";
			updateData["system.agemods.bod"] = "+200";
			updateData["system.agemods.dex"] = "-50";
			updateData["system.agemods.rfl"] = "+0";
			updateData["system.agemods.int"] = "+200";
			updateData["system.agemods.wil"] = "+250";
			updateData["system.agemods.cha"] = "+25";
		}
		else if(age >= 51 && age < 61) {
			updateData["system.agemods.str"] = "+200";
			updateData["system.agemods.bod"] = "+100";
			updateData["system.agemods.dex"] = "-50";
			updateData["system.agemods.rfl"] = "-100";
			updateData["system.agemods.int"] = "+200";
			updateData["system.agemods.wil"] = "+250";
			updateData["system.agemods.cha"] = "-25";
		}
		else if(age >= 61 && age < 71) {
			updateData["system.agemods.str"] = "+100";
			updateData["system.agemods.bod"] = "+0";
			updateData["system.agemods.dex"] = "-150";
			updateData["system.agemods.rfl"] = "-100";
			updateData["system.agemods.int"] = "+250";
			updateData["system.agemods.wil"] = "+250";
			updateData["system.agemods.cha"] = "-75";
		}
		else if(age >= 71 && age < 81) {
			updateData["system.agemods.str"] = "-50";
			updateData["system.agemods.bod"] = "-125";
			updateData["system.agemods.dex"] = "-150";
			updateData["system.agemods.rfl"] = "-200";
			updateData["system.agemods.int"] = "+250";
			updateData["system.agemods.wil"] = "+200";
			updateData["system.agemods.cha"] = "-175";
		}
		else if(age >= 81 && age < 91) {
			updateData["system.agemods.str"] = "-200";
			updateData["system.agemods.bod"] = "-275";
			updateData["system.agemods.dex"] = "-250";
			updateData["system.agemods.rfl"] = "-300";
			updateData["system.agemods.int"] = "+150";
			updateData["system.agemods.wil"] = "+150";
			updateData["system.agemods.cha"] = "-275";
		}
		else if(age >= 91 && age < 101) {
			updateData["system.agemods.str"] = "-350";
			updateData["system.agemods.bod"] = "-450";
			updateData["system.agemods.dex"] = "-400";
			updateData["system.agemods.rfl"] = "-425";
			updateData["system.agemods.int"] = "+0";
			updateData["system.agemods.wil"] = "+50";
			updateData["system.agemods.cha"] = "-375";
		}
		else if(age >= 101) {
			updateData["system.agemods.str"] = "-550";
			updateData["system.agemods.bod"] = "-650";
			updateData["system.agemods.dex"] = "-600";
			updateData["system.agemods.rfl"] = "-575";
			updateData["system.agemods.int"] = "-200";
			updateData["system.agemods.wil"] = "-50";
			updateData["system.agemods.cha"] = "-525";
		}
		
		this.actor.update(updateData);
	}
	
	async DeleteCustomSkill(event) {
		const element = event.currentTarget;
		const dataset = element.dataset;
		
		//split id="delete-survival-{{key}}" into 3 and assign the indexes
		const baseSkill = element.id.split("-")[1];
		const skillName = element.id.split("-")[2];
		
		//Make a dupe list and cleanse+update the real one.
		let skills = foundry.utils.duplicate(this.actor.system.skills[baseSkill]);
		const updateTarget = "system.skills."+baseSkill;
		let updateData = {};
		updateData[updateTarget] = [];
		await this.actor.update(updateData);
		updateData = {};
		
		Object.entries(skills).forEach(skill => {
			const data = skill[1];
			if(skill[0] != skillName) {
				updateData[updateTarget+"."+skill[0]] = {
					xp: data.xp,
					mod: data.mod,
					level: data.level,
					link: data.link,
					tn: data.tn,
					type: data.type,
					baseSkill: baseSkill
				}
			}
		});
		
		console.log(updateData);
		await this.actor.update(updateData);
	}
	
	AddNewSkill(event) {
		const element = event.currentTarget;
		const dataset = element.dataset;
		console.log(dataset);
		
		const actorData = this.getData().actor;
		const systemData = actorData.system;
		
		const baseSkill = dataset.baseskill;
		const newSkillName = element.value;
		const link = dataset.link;
		console.log(link);
		
		let updateData = {};
		updateData = {
			xp: 0,
			mod: this.GetLinkMod(link.split("+"), systemData),
			level: -1,
			link: link,
			tn: dataset.tn,
			type: dataset.type,
			name: element.value,
			baseSkill: baseSkill
		};
		console.log(updateData);
		
		element.value = "";
		
		if(baseSkill != undefined && baseSkill != "") {
			this.actor.update({
				["system.skills."+baseSkill+"."+newSkillName]: updateData
			});
		}
		else {
			this.actor.update({
				["system.skills."+element.value]: updateData
			});
		}
		
		/*this.actor.update({
			["system.skills."+baseSkill+"."+newSkillName]: updateData
		});*/
		//this.render();
	}
	
	async ModifyTraitComponent(event) {
		const element = event.currentTarget;
		const dataset = element.dataset;
		
		const value = element.value;
		const traitId = dataset.traitid.split("@")[0];
		const which = dataset.traitid.split("@")[1];
		
		let updateData = {};
		if(which == "subtitle") {
			updateData["system.traits."+traitId] = {
				subtitle: value
			};
		}
		else if(which == "description") {
			updateData["system.traits."+traitId] = {
				description: value
			};
		}
		console.log(updateData);
		
		await this.actor.update(updateData);
		await this.render();
	}
	
	// Generate a random UUID
	UUID() {
		return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'
		.replace(/[xy]/g, function (c) {
			const r = Math.random() * 16 | 0, 
				v = c == 'x' ? r : (r & 0x3 | 0x8);
			return v.toString(16);
		});
	}
	
	AddNewTrait(event) {
		const element = document.getElementById("new-trait-selector");
		if(element.value == undefined || element.value == "") {
			console.error("Trait {0} from selector not recognised", element.value);
			return;
		}
		
		const traits = foundry.utils.duplicate(this.actor.system.traits);
		
		const uuid = this.UUID();
		let updateData = {};
		updateData["system.traits.trait-"+uuid] = {
			id: "trait-" + uuid,
			name: element.value,
			subtitle: "",
			level: 0,
			xp: 0,
			description: ""
		};
		
		this.actor.update(updateData);
		this.render();
	}
	
	async DeleteTrait(event) {
		const element = event.currentTarget;
		const targetId = element.id.split("-delete")[0];
		
		let traits = foundry.utils.duplicate(this.actor.system.traits);
		let updateData = {};
		updateData["system.traits"] = [];
		await this.actor.update(updateData);
		
		updateData = {};
		let i = 1;
		Object.entries(traits).forEach(entry => {
			console.log(entry);
			const data = entry[1];
			const name = data.name;
			const subtitle = data.subtitle;
			const level = data.level;
			const xp = data.xp;
			const description = data.description;
			const id = data.id;
			
			if(id != targetId) {
				updateData["system.traits."+id] = {
					name: name,
					id: id,
					subtitle: subtitle,
					description: description,
					level: level,
					xp: xp
				};
			}
		});
		
		await this.actor.update(updateData);
	}
	
	async TraitToChatMessage(event) {
		const element = event.currentTarget;
		const traitId = element.id;
		const data = foundry.utils.duplicate(this.actor.system.traits)[traitId];
		const actorData = this.getData().actor;
		
		const flavour = "";
		let msgData = {
			name: data.name,
			flavour: flavour,
			speaker: actorData.name,
			subtitle: data.subtitle,
			description: data.description,
			level: data.level
		};
		msgData = ChatMessage.applyRollMode(msgData, game.settings.get("core", "rollMode"));
		
		const render = await renderTemplate("systems/a-time-of-war/templates/chat/Trait.hbs", msgData);
		const msg = await ChatMessage.create({
			content: render//,
			//sound: CONFIG.sounds.dice
		});
		
		return msg;
	}
	
	_onDualAttributeRollToggle(event) {
		const element = event.currentTarget;
		
		const dar = document.getElementById("dual-attribute-roll");
		if(element.checked) {
			dar.classList.remove("hidden");
			document.getElementById("dual-attribute-divider").classList.add("hidden");
		}
		else {
			dar.value = "";
			dar.classList.add("hidden");
			document.getElementById("dual-attribute-divider").classList.remove("hidden");
		}
	}
	
	async DeleteAdvance(event) {
		const element = event.currentTarget;
		const targetId = element.id;
		
		let advances = foundry.utils.duplicate(this.actor.system.advances);
		console.log("advances: {0}", advances);
		let updateData = {};
		updateData["system.advances"] = [];
		await this.actor.update(updateData);
		
		updateData = {};
		let i = 1;
		Object.entries(advances).forEach(entry => {
			console.log(entry);
			const data = entry[1];
			const type = data.type;
			const name = data.name;
			const xp = data.xp;
			const id = data.id;
			const traitId = data.traitId;
			const free = data.free;
			const baseSkill = data.baseSkill;
			console.log("targetId: {0}, id: {1}", targetId, id);
			
			if(id != targetId) {
				updateData["system.advances."+id] = {
					type: type,
					name: name,
					xp: xp,
					id: ("advance-" + i++),
					baseSkill: baseSkill,
					traitId: traitId,
					free: free
				}
			}
		});
		
		await this.actor.update(updateData);
		this.CleanAdvanceMaker();
	}
	
	//When you click the free XP toggle/checkbox, it calls this function.
	_onAdvanceFreeToggle(event) {
		const element = event.currentTarget;
		
		const actorData = this.actor;
		const systemData = actorData.system;
		const advanceMaker = systemData.advanceMaker;
		
		advanceMaker.free = !advanceMaker.free;
		
		console.log("Advances: {0}", this.getData().actor.system.advances);
	}
	
	_onAdvanceUpdate(event) {
		const element = event.currentTarget;
		const value = element.value;
		const id = element.id;
		const selectedIndex = element.dataset.index;
		
		const actorData = this.actor;
		const systemData = actorData.system;
		const advanceMaker = systemData.advanceMaker;
		
		//if id = "advance-type" then id.split('-')[1] = type;
		const which = id.split('-')[1];
		
		advanceMaker[which] = value;
		console.log(advanceMaker);
		
		/*let updateData = {};
		updateData["system.advanceMaker"] = {
			"type": advanceMaker,
			"name": "",
			"xp": 0,
			"free": false,
			"baseSkill": null,
			"subtitle": "",
			"traitId": "",
			"id": ""
		};*/
		
		this.render();
		
		//Save values from the inputs before rendering!
		//const savedType = "attribute";
		//const savedName = "cha";
		//const savedXP = 50;
		
		//let thing = document.querySelector('#advance-type option[value='+advanceMaker.type+']');
		//console.log(thing);
		
		//this.render();
		
		/*console.log(document.getElementById("advance-type").selectedIndex);
		document.getElementById("advance-type").selectedIndex = 1;
		console.log(document.getElementById("advance-type").selectedIndex);
		document.getElementById("advance-type")[thing.dataset.index].selected = "selected";
		
		document.getElementById("advance-type").selectedIndex = 0;
		document.getElementById("advance-name").selectedIndex = 6;
		document.getElementById("advance-xp").value = savedXP;
		console.log(document.getElementById("advance-type"));
		console.log(document.getElementById("advance-type")[thing.dataset.index]);*/
		
		//document.querySelector('#advance-'+which+' option[value='+value+']');
		
		/*let updateData = {};
		updateData["system.advanceMaker"] = {
			"type": value,
			"name": "",
			"xp": 0,
			"free": false,
			"baseSkill": null,
			"subtitle": "",
			"traitId": "",
			"id": ""
		}
		this.actor.update(updateData);*/
	}
	
	//async _onAdvanceUpdate(event) {
		//event.preventDefault();
		/*const element = event.currentTarget;
		const id = element.id;
		let value = element.value;
		
		const actorData = this.actor;
		const systemData = actorData.system;*/
		
		/*const which = id.split('advance-')[1];
		switch(which) {
			case "type":
				systemData.advanceMaker.type = value;
				systemData.advanceMaker.name = undefined;
				systemData.advanceMaker.xp = undefined;
				systemData.advanceMaker.baseSkill = undefined;
				systemData.advanceMaker.traitId = undefined;
				systemData.advanceMaker.id = undefined;
				break;
			case "name":
				if(value.includes('/')) {
					let baseSkill = value.split('/')[0];
					value = value.split('/')[1];
					systemData.advanceMaker.baseSkill = baseSkill;
					systemData.advanceMaker.name = value;
				}
				else {
					systemData.advanceMaker.baseSkill = undefined;
					systemData.advanceMaker.name = value;
				}
				systemData.advanceMaker.xp = undefined;
				break;
			case "xp":
				systemData.advanceMaker.xp = parseInt(value);
				break;
			default:
				break;
		}
		console.log("advanceMaker: ", systemData.advanceMaker);*/
		
		/*let updateData = {};
		updateData["system.advanceMaker"] = {
			"type": systemData.advanceMaker.type,
			"name": systemData.advanceMaker.name,
			"xp": systemData.advanceMaker.xp,
			"free": systemData.advanceMaker.free,
			"baseSkill": systemData.advanceMaker.baseSkill,
			"subtitle": systemData.advanceMaker.subtitle,
			"traitId": systemData.advanceMaker.traitId,
			"id": systemData.advanceMaker.id
		}
		console.log("updateData: ", updateData);
		
		this.actor.update(updateData);*/
		
		//reset the dropdown selectors because, I dunno, rendering makes them blank but doesn't change their values or something weird.
		/*let selectedOption = document.querySelector("#advance-type option[value="+value+"]");
		document.getElementById("advance-type").selectedIndex = selectedOption.dataset.index;
		selectedOption = document.querySelector("#advance-name option[value="+value+"]");
		document.getElementById("advance-name").selectedIndex = selectedOption.dataset.index;*/
		
		//if(which == "type" || which == "name") {
			//let selectedOption = document.querySelector('#advance-'+which+' option[value='+value+']');
			//let index = selectedOption.dataset.index;
			//console.log(index);
			
		//}
		//document.getElementById("advance-type").selectedIndex = 
		
		/*const updateTarget = "system.advanceMaker";
		
		console.log(value);
		
		let orig = ["1", "2", "3"];
		orig[0] = document.getElementById("advance-type").value;
		orig[1] = document.getElementById("advance-name").value;
		orig[2] = document.getElementById("advance-xp").value;
		orig[3] = document.getElementById("advance-free").checked;
		
		//const actorData = this.getData().actor;
		//const systemData = actorData.system;
		//const advanceMaker = systemData.advanceMaker;
		
		let updateData = {};
		switch(id.split('advance-')[1]) {
			case "type":
				updateData[updateTarget] = {
					type: value
				}
				break;
			case "name":
				if(value.includes('/'))
				{
					let baseSkill = value.split('/')[0];
					value = value.split('/')[1];
					updateData[updateTarget] = {
						baseSkill: baseSkill,
						name: value
					}
				}
				else {
					updateData[updateTarget] = {
						baseSkill: undefined,
						name: value
					}
				}
				break;
			case "xp":
				updateData[updateTarget] = {
					xp: parseInt(value)
				}
				break;
			default:
				break;
		}
		
		await this.actor.update(updateData);*/
		
		/*document.getElementById("advance-type").value = orig[0];
		document.getElementById("advance-name").value = orig[1];
		document.getElementById("advance-xp").value = parseInt(orig[2]);
		document.getElementById("advance-free").checked = orig[3];*/
	//}
	
	//When you click the submit button on the advance maker, it calls this function.
	_onAdvanceFinish(event) {
		const actorData = this.actor;
		const systemData = actorData.system;
		const advanceMaker = systemData.advanceMaker;
		let id = "advance-";
		let i = 1;
		const advances = Object.entries(systemData.advances);
		i += advances.length;
		
		//Name validation
		const allowedAttributes = ["str", "bod", "dex", "rfl", "wil", "int", "cha", "edg"];
		if(advanceMaker.type == "attribute")
		{
			let name = advanceMaker.name;
			console.log(name);
			if(!allowedAttributes.includes(name)) {
				console.error("{0} is not a valid attribute", name);
				return;
			}
		}
		
		//XP input validation
		if(!parseInt(advanceMaker.xp) || advanceMaker.xp == "" || advanceMaker.xp == undefined || advanceMaker.xp == null) {
			console.error("XP {0} didn't parse correctly or was blank!", advanceMaker.xp);
			return;
		}
		
		let subtitle = "";
		let advanceName = advanceMaker.name;
		if(advanceMaker.type == "trait") {
			console.log("advanceMaker: {0}", advanceMaker);
			console.log("trait: {0}", systemData.traits[advanceMaker.name]);
			advanceName = systemData.traits[advanceMaker.name].name;
			subtitle = systemData.traits[advanceMaker.name].subtitle;
			console.log("Subtitle: {0}", subtitle);
		}
		
		//BaseSkill for custom skills;
		if(advanceMaker.type == "skill" && advanceName.includes('/')) {
			//This means you're dealing with a custom skill, because the others all use underscores in their naming ID.
			advanceMaker.baseSkill = advanceName.split('/')[0];
			advanceName = advanceName.split('/')[1];
		}
		
		//Make an advance schema with an appropriate name and fill it with the data from the advance maker
		let updateData = {};
		updateData["system.advances."+id+i] = {
			name: advanceName,
			type: advanceMaker.type,
			xp: advanceMaker.xp,
			free: advanceMaker.free,
			traitId: advanceMaker.type == "trait" ? advanceMaker.name : undefined,
			id: id+i,
			baseSkill: advanceMaker.baseSkill,
			subtitle: subtitle
		};
		console.log(advanceMaker.baseSkill);
		
		//Reset the advance maker
		updateData["system.advanceMaker"] = {
			name: "",
			type: "",
			xp: "",
			free: false,
			traitId: "",
			id: "",
			baseSkill: null,
			subtitle: ""
		}
		console.log(updateData);
		
		this.actor.update(updateData);
		this.RefreshSheet();
	}
	
	async UpdateAdvanceMaker() {
		const actorData = this.document.toObject(false);
		const systemData = actorData.system;
		const advanceMaker = systemData.advanceMaker;
		
		document.getElementById("advance-xp").value = advanceMaker.xp;
		document.getElementById("advance-type").value = advanceMaker.type;
		document.getElementById("advance-name").value = advanceMaker.name;
		document.getElementById("advance-free").checked = advanceMaker.free;
	}

	/**
	* Handle clickable rolls.
	* @param {Event} event   The originating click event
	* @private
	*/
	_onRoll(event) {
		event.preventDefault();
		const element = event.currentTarget;
		const dataset = element.dataset;

		const actorData = this.actor;
		const systemData = actorData.system;
		const rollData = actorData.getRollData();
		const rollType = dataset.rolltype;
		
		switch(rollType) {
			case "attribute":
				return this.RollAttribute(dataset, actorData, systemData, rollData);
			case "skill":
				return this.RollSkill(dataset, actorData, systemData, rollData);
			default:
				console.error("RollType " + rollType + " not recognised!");
				return null;
		}
	}
	
	GetLinkMod(linkText, systemData, level = false) {
		let link = 0;
		
		//Are there two linked attributes?
		if(linkText.length > 1) {
			let linkA = !level ? this.GetAttributeMod(systemData.attributes[linkText[0]].level) : systemData.attributes[linkText[0]].level;
			let linkB = !level ? this.GetAttributeMod(systemData.attributes[linkText[1]].level) : systemData.attributes[linkText[1]].level;
			link += linkA + linkB;
		}
		else {
			link += !level ? this.GetAttributeMod(systemData.attributes[linkText].level) : systemData.attributes[linkText].level;
		}
		
		return link;
	}
	
	GetAttributeMod(level) {
		if(level <= 0)
			return -4;
		else if(level == 1)
			return -2;
		else if(level == 2 || level == 3)
			return -1;
		else if(level >= 4 && level <= 6)
			return 0;
		else if(level >= 7 && level <= 9)
			return 1;
		else if(level == 10)
			return 2;
		else if(level >= 11) //Attribute/3 rounding down, max +5
			return Math.min(5, Math.floor(level/3));
	}
	
	async RollAttribute(dataset, actorData, systemData, rollData) {
		//Figure out the link modifier.
		let linkText = dataset.link.split("+");
		
		//Is it a dual attribute roll?
		let name = dataset.label;
		const dar = document.getElementById("dual-attribute-roll");
		if(!dar.classList.contains("hidden")) {
			linkText = (dar.value + dataset.link).split("+");
			name = dar.value.toUpperCase() + dataset.link.toUpperCase();
		}
		
		dar.value = "";
		dar.classList.add("hidden");
		document.getElementById("dual-attribute-divider").classList.remove("hidden");
		document.getElementsByClassName("dual-attribute-roll")[0].checked = false;
		
		let link = this.GetLinkMod(linkText, systemData, true);
		
		//Set the base TN
		let tn = 7;
		const twoAttributes = linkText.length > 1;
		if(twoAttributes)
			tn = 18;
		else
			tn = 12;
			
		//Build the roll manually because we can't have nice things.
		let dice = {};
		let num = 2;
		let total = 0;
		let sixes = 0;
		for(var i = 0; i < num; i++) {
			let roll = await new Roll('1d6', rollData).evaluate();
			const value = roll.dice[0].results[0].result;
			console.log(value);
			dice[i] = value;
			total += value;
			
			//If you get two 6s, it explodes and further 6s explode; ergo while you're on 2d6, a 12 explodes, but while you're on 3d6, an 18 (6+6+6) would explode.
			if(value == 6 && sixes < 5) {
				sixes++;
				if(sixes >= 2)
					num++;
			}
		}
		const isStunning = sixes >= 2;
		const isFumble = total == 2;
		
		//Add the rollmod:
		total += link;
		
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
			lowest: -1,
			rollMod: link,
			speaker: actorData.name,
			untrained: false,
			tn: tn,
			actionType: "SB",
			rollType: "attribute",
			img: actorData.img,
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
	
	async RollSkill(dataset, actorData, systemData, rollData) {
		const name = dataset.label;
		const baseSkill = dataset.baseskill;
		console.log("TRYING TO ROLL SKILL {0}", name);
		
		const skill = baseSkill == undefined ? systemData.skills[name] : systemData.skills[baseSkill][name];
		const level = skill.level;
		const isTrained = level > -1;
		const link = skill.link;
		const tn = isTrained ? skill.tn : (link.toString().includes("+") ? 18 : 12);
		const actionType = skill.type;
		
		//NaturalAptitude calcs
		const neededTP = actionType.slice(1,1) == "A" ? 5 : 3;
		let traitLevel = 0;
		Object.entries(systemData.traits).forEach(entry => {
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
		
		//Add the rollmod:
		const rollMod = this.GetLinkMod(link.split("+"), systemData, !isTrained) + (isTrained ? level : 0);
		total += rollMod;
		
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
			rollMod: rollMod,
			speaker: actorData.name,
			untrained: !isTrained,
			tn: tn,
			actionType: actionType,
			rollType: "skill",
			img: actorData.img,
			baseSkill: baseSkill,
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
}