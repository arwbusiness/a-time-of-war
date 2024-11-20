/**
 * Extend the base Actor document by defining a custom roll data structure which is ideal for the Simple system.
 * @extends {Actor}
 */
export class BTActor extends Actor {
	/** @override */
	prepareData() {
		// Prepare data for the actor. Calling the super version of this executes
		// the following, in order: data reset (to clear active effects),
		// prepareBaseData(), prepareEmbeddedDocuments() (including active effects),
		// prepareDerivedData().
		super.prepareData();
	}

	/** @override */
		prepareBaseData() {
		// Data modifications in this step occur before processing embedded
		// documents or derived data.
	}

	/**
	* @override
	* Augment the actor source data with additional dynamic data. Typically,
	* you'll want to handle most of your calculated/derived data in this step.
	* Data calculated in this step should generally not exist in template.json
	* (such as ability modifiers rather than ability scores) and should be
	* available both inside and outside of character sheets (such as if an actor
	* is queried and has a roll executed directly from it).
	*/
	prepareDerivedData() {
		const actorData = this;
		const systemData = actorData.system;
		const flags = actorData.flags.bt || {};

		// Make separate methods for each Actor type (character, npc, etc.) to keep
		// things organized.
		this._preparePcData(actorData);
		this._prepareNpcData(actorData);
		this._prepareVehicleData(actorData);
	}

	/**
	* Prepare Character type specific data
	*/
	_preparePcData(actorData) {
		if (actorData.type !== 'pc')
			return;
		
		//this.CalculateSkillLevels(actorData, systemData);
		
		//this.AddCustomSkill(systemData, "art", "painting", "dex", "");
		
		const systemData = actorData.system;
		
		//Reset skills by setting their XP to 0.
		const skills = Object.entries(systemData.skills);
		skills.forEach(skill => {
			let name = skill[0];
			let data = Object.entries(skill[1]);
			if(data.length == 0)
				return;
			
			const isCustomSkill = data[0][0] != "xp";
			if(isCustomSkill) {
				name = data[0][0];
				data = data[0][1];
			}
			else
				data = skill[1];
			
			data.xp = 0;
		});
		
		//Reset attributes by setting their XP to 0.
		const attributes = Object.entries(systemData.attributes);
		attributes.forEach(attribute => {
			attribute.xp = 0;
		});
		
		//Reset traits by setting their XP to 0.
		//if(systemData.traits == undefined) { systemData.traits = {}; } //Traits can be null, so if it is, just make it empty.
		const traits = Object.entries(systemData.traits);
		traits.forEach(trait => {
			trait.xp = 0;
		});
		
		//Reset spent XP counter.
		systemData.xp_spent = 0;
		
		console.log("Advances: {0}", systemData.advances);
		
		//Check advances and plug the XP back into the sheet.
		//if(systemData.advances == undefined) { systemData.advances = {}; } //Advances can be null, so if it is, just make it empty.
		Object.entries(systemData.advances).forEach(adv => {
			const advance = adv[1];
			const xp = advance.xp;
			console.log("Advance: {0}, XP: {1}", advance, xp);
			switch(advance.type) {
				case "skill":
					const skill = (advance.baseSkill != "") ? skills[advance.name] : skills[advance.baseSkill][advance.name];
					skill.xp += xp;
					break;
				case "attribute":
					const attribute = systemData.attributes[advance.name];
					attribute.xp += xp;
					break;
				case "trait":
					const trait = systemData.traits[advance.name];
					trait.xp += xp;
					break;
				default:
					console.error("Advance type {0} not recognised!", advance.type);
					break;
			}
			systemData.xp_spent += advance.free ? 0 : xp;
		});
		console.log(systemData.xp_spent);
		
		this.CalculateSkillLevels(skills, systemData);
		this.CalculateAttributeAndTraitLevels(attributes, traits);
	}
	
	CalculateAttributeAndTraitLevels(attributes, traits) {
		attributes.forEach(attribute => {
			console.log("Attribute: {0}, XP: {1}", attribute, attribute.xp);
			attribute.level = this.CalcTP(attribute.xp);
			attribute.mod = this.GetAttributeMod(attribute.level);
		});
		traits.forEach(trait => {
			trait.level = this.CalcTP(trait.xp);
		});
		
		let updateData = attributes;
		const dataName = 'system.attributes';
		this.update(updateData);
	}
	
	CalculateSkillLevels(skills, systemData) {
		const tieredSkills = ["computers", "martial_arts", "melee_weapons", "pickpocket", "sleightofhand", "quickdraw", "art", "interest"];
		const customSkills = ["art", "career", "interest", "language", "protocol", "science", "streetwise", "survival"];
		
		for(var i = 0; i <= skills.length-1; i++) {
			
			let name = skills[i][0];
			let data = Object.entries(skills[i][1]);
			if(data.length == 0) //Skip custom skill groups that are empty
				continue;
			
			const isCustomSkill = data[0][0] != "xp";
			if(isCustomSkill) {
				name = data[0][0];
				data = data[0][1];
			}
			else
				data = skills[i][1];
			
			//extract the elements for use
			const xp = data.xp;
			let mod = data.mod;
			let level = data.level;
			//const link = data.link;
			let tn = data.tn;
			let type = data.type;
			
			//What's the Link Modifier?
			let linkText = data.link.toString().split("+");
			const linkA = systemData.attributes[linkText[0]].mod;
			const linkB = linkText.length == 2 ? systemData.attributes[linkText[1]].mod : 0;
			const linkMod = linkA + linkB;
			
			//Calculate the Skill Level based on XP:
			level = this.CalcSL(xp);
			
			//Calculate the roll mod:
			mod = linkMod + level;
			
			//Uprate tiered skills.
			if(name in tieredSkills && level > 3) {
				tn++;
				type = type.substring(0,1)+"A";
			}
		}
	}
	
	AddCustomSkill(systemData, baseSkill, skillName, linkA, linkB) {
		const skills = Object.entries(systemData.skills);
		const skill = {
				xp: 0,
				mod: 0,
				level: -1,
				link: linkA + (linkB != "" ? ("+" + linkB) : ""),
				tn: 7,
				type: "SB"
		}
		systemData.skills[baseSkill][skillName] = skill;
	}
	
	CreateAdvance(systemData, name, type, xp, free = false) {
		systemData.advances["name"] = {
			name: name,
			type: type,
			xp: xp,
			free: free
		};
	}
	
	CalcTP(xp) {
		return xp >= 0 ? Math.floor(xp/100) : Math.ceil(xp/100);
	}
	
	CalcSL(xp) {
		if(xp >= 570)
			return 10;
		
		let sl = -1;
		let mult = 1;
		for(var l = 20; l <= 570; mult++) {
			if(xp <= l)
				break;
			else {
				l += (10*mult);
				sl++;
			}
		}
		
		return sl;
	}
	
	CalcXPForNextSL(xp) {
		if(xp >= 570)
			return 0;
		
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
	}
	
	GetAttributeMod(level) {
		if(level == 0)
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
	
	/**
	* Prepare NPC type specific data.
	*/
	_prepareNpcData(actorData) {
		if (actorData.type !== 'npc')
			return;

		const systemData = actorData.system;

		//systemData.xp = systemData.cr * systemData.cr * 100;
	}

  /**
   * Prepare NPC type specific data.
   */
  _prepareVehicleData(actorData) {
    if (actorData.type !== 'vehicle') return;

    // Make modifications to data here. For example:
    const systemData = actorData.system;
    
	//systemData.xp = systemData.cr * systemData.cr * 100;
  }

  /**
   * Override getRollData() that's supplied to rolls.
   */
  getRollData() {
    // Starts off by populating the roll data with a shallow copy of `this.system`
    const data = { ...this.system };

    // Prepare character roll data.
    this._getPCRollData(data);
    this._getNPCRollData(data);
    this._getVehicleRollData(data);

    return data;
  }

  /**
   * Prepare character roll data.
   */
  _getPCRollData(data) {
    if (this.type !== 'pc') return;

    // Copy the ability scores to the top level, so that rolls can use
    // formulas like `@str.mod + 4`.
    /*if (data.abilities) {
      for (let [k, v] of Object.entries(data.abilities)) {
        data[k] = foundry.utils.deepClone(v);
      }
    }

    // Add level for easier access, or fall back to 0.
    if (data.attributes.level) {
      data.lvl = data.attributes.level.value ?? 0;
    }*/
  }

  /**
   * Prepare NPC roll data.
   */
  _getNPCRollData(data) {
    if (this.type !== 'npc') return;

    // Process additional NPC data here.
  }

  /**
   * Prepare Vehicle roll data.
   */
  _getVehicleRollData(data) {
    if (this.type !== 'vehicle') return;

    // Process additional Vehicle data here.
  }
}
