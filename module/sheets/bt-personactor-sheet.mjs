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
      width: 600,
      height: 600,
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
      //this._prepareItems(context);
    }

    // Prepare NPC data and items.
    if (actorData.type == 'npc') {
		this._prepareNPCData(context);
      //this._prepareItems(context);
    }

    // Enrich biography info for display
    // Enrichment turns text like `[[/r 1d20]]` into buttons
    /*context.enrichedBiography = await TextEditor.enrichHTML(
      this.actor.system.biography,
      {
        // Whether to show secret blocks in the finished html
        secrets: this.document.isOwner,
        // Necessary in v11, can be removed in v12
        async: true,
        // Data to fill in for inline rolls
        rollData: this.actor.getRollData(),
        // Relative UUID resolution
        relativeTo: this.actor,
      }
    );*/

    // Prepare active effects
    /*context.effects = prepareActiveEffectCategories(
      // A generator that returns all effects stored on the actor
      // as well as any items
      this.actor.allApplicableEffects()
    );*/

    return context;
  }

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
			return this.CalcXPForNextSL(xp);
		});
		Handlebars.registerHelper('calcXPForNextTP', function(xp) {
			return 100-xp == 0 ? 100 : 100-xp;
		});
	}
  
	//Prepare the stuff that isn't in template.json (usually because it's temporary or user-defined).
	/*_prepareVariables(context) {
		console.log("Preparing variables.");
		const systemData = context.system;
		
		if(systemData.traits == undefined)
			systemData.traits = {};
		if(systemData.advances == undefined)
			systemData.advances = {};
		
		//define advanceMaker
		if(systemData.advanceMaker == undefined) {
			systemData.advanceMaker = {
				type: "",
				name: "",
				xp: 0,
				free: false
			}
		}
	}*/

	/**
	* Character-specific context modifications
	*
	* @param {object} context The context object to mutate
	*/
	_prepareNPCData(context) {
		// This is where you can enrich character-specific editor fields
		// or setup anything else that's specific to this type
	}

  /**
   * Organize and classify Items for Actor sheets.
   *
   * @param {object} context The context object to mutate
   */
  _prepareItems(context) {
    // Initialize containers.
    /*const gear = [];
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
    context.spells = spells;*/
  }

  /* -------------------------------------------- */

	/** @override */
	activateListeners(html) {
		super.activateListeners(html);

		// Rollable abilities.
		html.on('click', '.rollable', this._onRoll.bind(this));
		
		//Adding new skills and traits
		html.on('change', '.add-new-skill', this.AddNewSkill.bind(this));
		//html.on('change', '.add-new-trait', this._addNewTrait.bind(this));

		//Activate progression listeners
		this.listenForProgression(html);

		// Render the item sheet for viewing/editing prior to the editable check.
		/*html.on('click', '.item-edit', (ev) => {
		  const li = $(ev.currentTarget).parents('.item');
		  const item = this.actor.items.get(li.data('itemId'));
		  item.sheet.render(true);
		});*/

		// -------------------------------------------------------------
		// Everything below here is only needed if the sheet is editable
		if (!this.isEditable) return;

		// Add Inventory Item
		/*html.on('click', '.item-create', this._onItemCreate.bind(this));

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

	//These listeners make the advance maker work.
	listenForProgression(html) {
		console.log("Binding progression events, {0}", html);
		
		//Bind the advance delete buttons.
		html.on('click', '.delete-advance', this._onDeleteAdvance.bind(this));
		
		//Bind the advance creation sequence.
		html.on('click', '.advance-free', this._onAdvanceFreeToggle.bind(this));
		html.on('change','.advance-type', this._onAdvanceUpdate.bind(this));
		html.on('change','.advance-name', this._onAdvanceUpdate.bind(this));
		html.on('input','.advance-xp', this._onAdvanceUpdate.bind(this));
		html.on('click', '.advance-finish', this._onAdvanceFinish.bind(this));
	}
	
	AddNewSkill(event) {
		const element = event.currentTarget;
		const dataset = element.dataset;
		
		const actorData = this.getData().actor;
		const systemData = actorData.system;
		
		const baseSkill = dataset.baseskill;
		const newSkillName = element.value;
		const link = document.getElementsByClassName("new-skill-link-"+baseSkill)[0];
		
		const dataName = 'system.skills.'+baseSkill+'.'+newSkillName;
		let updateData = {};
		updateData[dataName] = {
			xp: 0,
			mod: 0,
			level: -1,
			link: link.value,
			tn: dataset.tn,
			type: dataset.type
		};
		
		element.value = "";
		link.value = "";
		
		//this.actor.update(updateData);
		//systemData.skills[baseSkill][newSkillName] = updateData;
		this.Update(updateData, "skills", baseSkill, newSkillName);
	}
	
	Update(updateData, ...keys) {
		this.actor.update(updateData);
		let systemData = this.getData().actor.system;
		let thing = systemData;
		for(var i = 0; i < keys.length; i++) {
			if(i < keys.length-1)
				thing = thing[keys[i]];
			else
				thing = updateData;
		}
	}
	
	/*RefreshSheet() {
		this.document.prepareDerivedData();
		this.render();
	}*/
	
	_onDeleteAdvance(event) {
		const element = event.currentTarget;
		const dataset = element.dataset;
		
		const actorData = this.getData().actor;
		const systemData = actorData.system;
		
		const targetName = dataset.name;
		const targetType = dataset.type;
		const targetXP = dataset.xp;
		const targetId = dataset.id;
		
		const advances = systemData.advances;
		console.log(advances);
		console.log("name: {0}, type: {1}, target: {2}", targetName, targetType, targetXP);
		let advance = null;
		for(var i = 0; i < advances.length; i++) {
			let adv = advances[i];
			console.log("adv name: {0}, type: {1}, target: {2}, id: {3}", adv.name, adv.type, adv.xp, adv.id);
			if(adv.name == targetName && adv.type == targetType && adv.xp == targetXP && adv.id == targetId) {
				advance = adv;
			}
		}
		console.log(advance);
		console.log(advances[advance]);
		
		//const advance = systemData.advances[targetName];
		//console.log(advance);
		
		//systemData.advances[targetName] = {};
		
		let list = Object.entries(advances);
		list.pop(advance);
		console.log(list);
	}
	
	//When you click the free XP toggle/checkbox, it calls this function.
	_onAdvanceFreeToggle(event) {
		const element = event.currentTarget;
		
		const actorData = this.getData().actor;
		const systemData = actorData.system;
		const advanceMaker = systemData.advanceMaker;
		
		advanceMaker.free = !advanceMaker.free;
	}
	
	//When you alter (oninput) an input field in the advance maker, it calls this function where 'which' is type, name or xp based on which field you changed.
	_onAdvanceUpdate(event) {
		const element = event.currentTarget;
		
		const actorData = this.getData().actor;
		const systemData = actorData.system;
		const advanceMaker = systemData.advanceMaker;
		
		const which = element.id.split("advance-")[1];
		const value = element.value;
		console.log("Which: {0}, Value: {1}", which, value);
		
		//See if it's a custom skill
		const isCustomSkill = which == "name" && value.includes("/");
		if(isCustomSkill) {
			advanceMaker.baseSkill = value.split("/")[0];
			advanceMaker.name = value.split("/")[1];
		}
		else {
			if(which == "xp" && !parseInt(value)) {
				console.error("value {0} can't be parsed to int", value);
				return;
			}
			else {
				switch(which) {
					case "type":
						advanceMaker.type = value;
						break;
					case "name":
						advanceMaker.name = value;
						break;
					case "xp":
						advanceMaker.xp = value;
						break;
					default:
						break;
				}
			}
		}
		console.log(advanceMaker);
	}
	
	//When you click the submit button on the advance maker, it calls this function.
	_onAdvanceFinish(event) {
		//event.preventDefault();
		
		const actorData = this.getData().actor;
		const systemData = actorData.system;
		const advanceMaker = systemData.advanceMaker;
		let id = "advance-";
		let i = 1;
		const advances = Object.entries(systemData.advances);
		advances.forEach(advance => {
			if(advance.id != undefined)
			{
				let tid = advance.id.split('-')[1];
				if(tid > i)
					i = tid + 1;
			}
		});
		
		//Make an advance schema with an appropriate name and fill it with the data from the advance maker
		const dataName = 'system.advances.'+advanceMaker.name;
		let updateData = {};
		updateData[dataName] = {
			name: advanceMaker.name,
			type: advanceMaker.type,
			xp: advanceMaker.xp,
			free: advanceMaker.free,
			id: id+i
		};
		/*systemData.advances[advanceMaker.name] = {
			name: advanceMaker.name,
			type: advanceMaker.type,
			xp: advanceMaker.xp,
			free: advanceMaker.free
		}
		console.log(systemData.advances);*/
		
		//console.log("Before: {0}", advanceMaker);
		
		//console.log("After: {0}", advanceMaker);
		
		//this.RefreshSheet();
		
		//this.actor.update(updateData);
		//systemData.skills[baseSkill][newSkillName] = updateData;
		this.Update(updateData, "advances", advanceMaker.name);
		
		//Reset the advance maker
		advanceMaker.type = "";
		advanceMaker.name = "";
		advanceMaker.xp = 0;
		advanceMaker.free = false;
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
		console.log("HEY");
		const element = event.currentTarget;
		const dataset = element.dataset;

		const actorData = this.actor;
		const systemData = actorData.system;
		const rollData = actorData.getRollData();
		const rollType = dataset.rolltype;
		
		switch(rollType) {
			case "attribute":
				return this.RollAttribute(element, dataset, actorData, systemData, rollData);
			case "skill":
				return this.RollSkill(element, dataset, actorData, systemData, rollData);
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
	
	async RollAttribute(element, dataset, actorData, systemData, rollData) {
		//Figure out the link modifier.
		const linkText = dataset.link.split("+");
		const link = this.GetLinkMod(linkText, systemData, true);
		console.log("TRYING TO ROLL ATTRIBUTE {0}", linkText);
		
		//Set the base TN
		let tn = 7;
		const twoAttributes = linkText.length > 1;
		if(twoAttributes)
			tn = 18;
		else
			tn = 12;
			
		const formula = "{2d6+" + link + "}cs>=" + tn;
		let roll = await new Roll(formula, rollData).evaluate();
		
		const results = roll.dice[0].results;
		const dice1 = results[0].result;
		const dice2 = results[1].result;
		const dice3 = results[2] != null && results[2] != undefined ? results[2].result : "";
		const droppedDie = Math.min(dice1,dice2,dice3) == dice1 ? 1 : Math.min(dice2,dice3) ? 2 : 3;
		
		const total = (dice3 ? dice1+dice2+dice3-Math.min(dice1,dice2,dice3) : dice1+dice2)+link;
		
		//This should round the (Total - TN / 2) down towards zero (if positive) and up towards zero (if negative)
		let margin = "+0";
		if(total > tn) {
			margin = "+" + Math.ceil((total - tn)/2);
		}
		else if(total < tn) {
			margin = Math.floor((total - tn)/2);
		}
		
		const flavor = "Rolling " + dataset.label + ":";
		let msgData = {
			name: dataset.label,
			dice1: dice1,
			dice2: dice2,
			dice3: dice3,
			droppedDie: droppedDie,
			rollMod: link == 0 ? "+0" : link,
			speaker: actorData.name,
			flavor: flavor,
			margin: margin,
			tn: tn,
			isSuccess: roll.total >= tn,
			successOrFail: margin < 0 ? "fail" : "success",
			rollType: "attribute",
			result: total,
			img: actorData.img
		};
		msgData = ChatMessage.applyRollMode(msgData, game.settings.get("core", "rollMode"));
		
		const render = await renderTemplate("systems/a-time-of-war/templates/roll/roll.hbs", msgData);
		const msg = await ChatMessage.create({
			content: render,
			sound: CONFIG.sounds.dice
		});
		
		return msg;
	}
	
	async RollSkill(element, dataset, actorData, systemData, rollData) {
		const name = dataset.label;
		const baseSkill = dataset.baseskill;
		console.log("TRYING TO ROLL SKILL {0}", name);
		
		const skill = baseSkill == undefined ? systemData.skills[name] : systemData.skills[baseSkill][name];
		const level = skill.level;
		const isTrained = level > -1;
		const link = skill.link;
		const tn = isTrained ? skill.tn : (link.toString().includes("+") ? 18 : 12);
		const actionType = skill.type;
		
		const rollMod = this.GetLinkMod(link.split("+"), systemData, !isTrained) + (isTrained ? level : 0);
		const formula = "{2d6+" + rollMod + "}cs>=" + tn;
		console.log(formula);
		let roll = await new Roll(formula, rollData).evaluate();
		
		const results = roll.dice[0].results;
		const dice1 = results[0].result;
		const dice2 = results[1].result;
		const dice3 = results[2] != null && results[2] != undefined ? results[2].result : "";
		const droppedDie = Math.min(dice1,dice2,dice3) == dice1 ? 1 : Math.min(dice2,dice3) ? 2 : 3;
		
		const total = (dice3 ? dice1+dice2+dice3-Math.min(dice1,dice2,dice3) : dice1+dice2) + rollMod;
		//keeps highest 2 by default but there's probably a negative trait that makes you roll 3 keep the two lowest, so I should account for that.
		
		//This should round the (Total - TN / 2) down towards zero (if positive) and up towards zero (if negative)
		let margin = "+0";
		if(total > tn) {
			margin = "+" + Math.ceil((total - tn)/2);
		}
		else if(total < tn) {
			margin = Math.floor((total - tn)/2);
		}
		
		/*let skillName = "";
		switch(dataset.label) {
			case "acrobatics_freefall":
				skillName = "Acrobatics/FreeFall";
				break;
			case "acrobatics_gymnastics":
				skillName = "Acrobatics/Gymnastics";
				break;
			case "acrobatics_gymnastics":
				skillName = "Acrobatics/Gymnastics";
				break;
			default:
				skillName = dataset.label;
				break;
		}
		*/
		/*if(baseSkill != undefined)
			skillName = baseSkill + "/" + dataset.label;
		else
			skillName = dataset.label;*/
		
		const flavor = "Rolling " + (baseSkill == undefined ? dataset.label : baseSkill + "/" + dataset.label) + (!isTrained ? " (Untrained)" : "") + ":";
		
		let msgData = {
			name: dataset.label,
			dice1: results[0].result,
			dice2: results[1].result,
			dice3: results[2] ? results[2].result : "",
			droppedDie: droppedDie,
			rollMod: rollMod == 0 ? "+0" : rollMod,
			speaker: actorData.name,
			flavor: flavor,
			margin: margin,
			tn: tn,
			isSuccess: roll.total >= tn,
			successOrFail: margin < 0 ? "FAILED" : "SUCCESS",
			actionType: actionType,
			rollType: "skill",
			result: total,
			img: actorData.img
		};
		msgData = ChatMessage.applyRollMode(msgData, game.settings.get("core", "rollMode"));
		
		const render = await renderTemplate("systems/a-time-of-war/templates/roll/roll.hbs", msgData);
		const msg = await ChatMessage.create({
			content: render,
			sound: CONFIG.sounds.dice
		});
		
		return msg;
	}
}