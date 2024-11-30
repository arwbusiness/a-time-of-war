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
		//const systemData = actorData.system;
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
		
		console.log(this);
		
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
			attribute[1].xp = 0;
		});
		
		//Reset traits by setting their XP to 0.
		const traits = Object.entries(systemData.traits);
		traits.forEach(trait => {
			trait[1].xp = 0;
		});
		
		//Reset spent XP counter.
		systemData.xp_spent = 0;
		
		//Increase the XP of everything on the sheet using the xp from saved advances.
		const customSkills = ["art", "career", "interest", "language", "protocol", "science", "streetwise", "survival"];
		Object.entries(systemData.advances).forEach(advance => {
			const data = advance[1];
			const xp = parseInt(data.xp);
			const type = data.type;
			const name = data.name;
			const traitId = data.traitId;
			const baseSkill = data.baseSkill;
			
			if(type == "attribute") {
				systemData.attributes[name].xp += xp;
			}
			
			/*if(type == "skill") {
				//console.log("baseSkill: {0}, name: {1}", baseSkill, name);
				if(baseSkill == undefined || baseSkill == "") {
					systemData.skills[name].xp += xp;
				}
				else if (customSkills.includes(baseSkill)) {
					//console.log(systemData.skills);
					//console.log("your baseSkill: {0}", systemData.skills[baseSkill]);
					systemData.skills[baseSkill][name].xp += xp;
				}
				else {
					console.error("baseSkill: {0} not recognised!", baseSkill);
				}
			}*/
			if(type == "skill") {
				//console.log("advance" + advance[0] + ", baseSkill: {0}, name: {1}", baseSkill, name);
				
				if(baseSkill == undefined || baseSkill == "") {
					systemData.skills[name].xp += xp;
				}
				else {
					systemData.skills[baseSkill][name].xp += xp;
				}
			}
			
			if(type == "trait") {
				systemData.traits[traitId].xp += xp;
			}
			
			systemData.xp_spent += data.free ? 0 : xp;
		});
		
		//Special case for Age modifiers
		const age = systemData.details.age;
		//Make an ageXP object to hold the age modifiers
		let ageXp = {
			str: 0,
			bod: 0,
			dex: 0,
			rfl: 0,
			wil: 0,
			int: 0,
			cha: 0
		};
		
		//Calculate the age modifiers
		if (age >= 25 && age < 31)
		{
			ageXp.str = 100;
			ageXp.bod = 100;
			ageXp.dex = 0;
			ageXp.rfl = 100;
			ageXp.wil = 100;
			ageXp["int"] = 100;
			ageXp.cha = 50;
		}
		else if (age >= 31 && age < 41)
		{
			ageXp.str = 200;
			ageXp.bod = 200;
			ageXp.dex = 0;
			ageXp.rfl = 0;
			ageXp.wil = 200;
			ageXp["int"] = 200;
			ageXp.cha = 50;
		}
		else if (age >= 41 && age < 51)
		{
			ageXp.str = 200;
			ageXp.bod = 200;
			ageXp.dex = -50;
			ageXp.rfl = 0;
			ageXp.wil = 250;
			ageXp["int"] = 0;
			ageXp.cha = 25;
		}
		else if (age >= 51 && age < 61)
		{
			ageXp.str = 200;
			ageXp.bod = 100;
			ageXp.dex = -50;
			ageXp.rfl = -100;
			ageXp.wil = 250;
			ageXp["int"] = 0;
			ageXp.cha = -25;
		}
		else if (age >= 61 && age < 71)
		{
			ageXp.str = 100;
			ageXp.bod = 0;
			ageXp.dex = -150;
			ageXp.rfl = -100;
			ageXp.wil = 250;
			ageXp["int"] = 0;
			ageXp.cha = -75;
		}
		else if (age >= 71 && age < 81)
		{
			ageXp.str = 0;
			ageXp.bod = -125;
			ageXp.dex = -150;
			ageXp.rfl = -200;
			ageXp.wil = 200;
			ageXp["int"] = 0;
			ageXp.cha = -150;
		}
		else if (age >= 81 && age < 91)
		{
			ageXp.str = -150;
			ageXp.bod = -275;
			ageXp.dex = -250;
			ageXp.rfl = -300;
			ageXp.wil = 150;
			ageXp["int"] = 0;
			ageXp.cha = -250;
		}
		else if (age >= 91 && age < 101)
		{
			ageXp.str = -300;
			ageXp.bod = -450;
			ageXp.dex = -400;
			ageXp.rfl = -425;
			ageXp.wil = 50;
			ageXp["int"] = 0;
			ageXp.cha = -350;
		}
		else if (age >= 101)
		{
			ageXp.str = -500;
			ageXp.bod = -650;
			ageXp.dex = -600;
			ageXp.rfl = -575;
			ageXp.wil = -50;
			ageXp["int"] = -200;
			ageXp.cha = -500;
		}
		
		//Ok, add the age XP now.
		systemData.attributes["str"].xp += ageXp.str;
		systemData.attributes["bod"].xp += ageXp.bod;
		systemData.attributes["dex"].xp += ageXp.dex;
		systemData.attributes["rfl"].xp += ageXp.rfl;
		systemData.attributes["wil"].xp += ageXp.wil;
		systemData.attributes["int"].xp += ageXp["int"];
		systemData.attributes["cha"].xp += ageXp.cha;
		
		//Ok, let's get the XP modifiers from modules
		let moduleXP = 0;
		for(let item of this.items) {
			if(item.type != "lifepath_module")
				return;
			
			const data = item.system;
			
			for(let entry of Object.entries(data.attributes)) {
				const id = entry[0];
				const data = entry[1];
				const name = data.name;
				const xp = parseInt(data.xp);
				systemData.attributes[name].xp += xp;
			}
			for(let entry of Object.entries(data.skills)) {
				const id = entry[0];
				const data = entry[1];
				const name = data.name;
				const xp = parseInt(data.xp);
				
				if(data.hasSubtitle) {
					const subtitle = data.subtitle;
					systemData.skills[name][subtitle].xp += xp;
				}
				else {
					systemData.skills[name].xp += xp;
				}
			}
			for(let entry of Object.entries(data.traits)) {
				const id = entry[0];
				const data = entry[1];
				const name = data.name;
				const xp = parseInt(data.xp);
				const subtitle = data.subtitle;
				
				let served = false;
				Object.entries(systemData.traits).forEach(en => {
					if(served)
						return;
					
					const trait = en[1];
					
					if(trait.name == name && (!data.hasSubtitle || trait.subtitle == subtitle)) {
						served = true;
						const traitId = trait.id;
						systemData.traits[id].xp += xp;
					}
				});
			}
			
			if(data.type == "affiliation" || data.type == "subaffiliation") {
				systemData.lifepath.img = item.img;
			}
			
			moduleXP += data.cost;
			console.log(moduleXP);
		}
		
		systemData.xp_spent += moduleXP;
		console.log(systemData.xp_spent);
		
		//Ok, get the levels!
		this.CalculateAttributeLevels(systemData);
		this.CalculateSkillLevels();
		this.CalculateTraitLevels(systemData);
		
		//Derived values!
		let hasToughness = false;
		let hasFit = false;
		Object.entries(systemData.traits).forEach(entry => {
			const trait = entry[1];
			
			if(trait.name == "Fit" && trait.level >= 2)
				hasFit = true;
			else if(trait.name == "Toughness" && trait.level >= 3)
				hasToughness = true;
			
			if(hasFit && hasToughness)
				return;
		});
		systemData.damage.max = Math.max(1, systemData.attributes.bod.level * 2 * (hasToughness ? 2 : 1));
		systemData.fatigue.max = Math.max(1, systemData.attributes.wil.level * 2 * (hasFit ? 2 : 1));
		systemData.luck.max = systemData.attributes.edg.level;
		
		//MP will be here somewhere. Will do it in a moment.
		systemData.mp.walk = Math.max(1, systemData.attributes.str.level + systemData.attributes.rfl.level);
		systemData.mp.run = Math.max(1, 10 + systemData.attributes.str.level + systemData.attributes.rfl.level + Math.max(0,systemData.skills.running.level));
		systemData.mp.sprint = Math.max(1, systemData.mp.run * 2);
		systemData.mp.climb = Math.max(1, Math.ceil(systemData.mp.walk/2)+Math.max(0,systemData.skills.climbing) / (systemData.skills.climbing.level == -1 ? 2 : 1));
		systemData.mp.crawl = Math.max(1, Math.ceil(systemData.mp.walk/4));
		systemData.mp.swim = Math.max(1, systemData.mp.walk + Math.max(0,systemData.skills.swimming.level) / (systemData.skills.swimming.level == -1 ? 2 : 1));
		
		//Don't forget to add a theoretical encumbrance.
		
		//this.render();
				
		//special case for primary language
		/*const lang_primary = systemData.details.lang_primary;
		if(lang_primary != undefined && lang_primary != "")
			systemData.skills["language"][lang_primary].xp = 0;*/
	}
	
	/*CalculateAttributeLevels(systemData) {
		const attributes = systemData.attributes;
		
		let updateData = {};
		let list = Object.entries(attributes);
		list.forEach(att => {
			const attribute = att[1];
			attribute.level = this.CalcTP(attribute.xp);
			//age modifier
			attribute.mod = this.GetAttributeMod(attribute.level);
			updateData["system.attributes."+att[0]] = attribute;
		});
		
		this.update(updateData);
	}*/
	
	CalculateAttributeLevels() {
		const systemData = this.system;
		
		Object.entries(systemData.attributes).forEach(entry => {
			const name = entry[0];
			const data = entry[1];
			const xp = data.xp;
			const level = this.CalcTP(xp);
			const mod = this.GetAttributeMod(level);
			systemData.attributes[name] = {
				level: level,
				xp: xp,
				mod: mod
			}
		});
	}
	
	CalculateSkillLevels() {
		const systemData = this.system;
		
		const tieredSkills = ["computers,dex+int,CA", "martial_arts,rfl+dex,SA", "melee_weapons,rfl+dex,SA", "pickpocket,rfl+dex,SA", "sleightofhand,rfl+dex,SA", "quickdraw,rfl+dex,SA", "art,dex+int,CA", "interest,int+wil,CA"];
		const customSkills = ["art", "career", "interest", "language", "protocol", "science", "streetwise", "survival"];
		
		Object.entries(customSkills).forEach(entry => {
			const skills = systemData.skills[entry[1]];
			Object.entries(skills).forEach(skill => {
				const name = skill[0];
				const data = skill[1];
				
				const xp = data.xp;
				const level = this.CalcSL(xp);
				let linkText = data.link != undefined ? data.link.split("+") : "none";
				const linkA = linkText != "none" ? systemData.attributes[linkText[0]].mod : 0;
				const linkB = linkText != "none" ? (linkText.length == 2 ? systemData.attributes[linkText[1]].mod : 0) : 0;
				const linkMod = linkText != "none" ? linkA + linkB : 0;
				const mod = level + linkMod;
				
				//Handle tiered skills
				let served = false;
				Object.entries(tieredSkills).forEach(t => {
					const tieredSkill = t[1].split(",");
					const n = tieredSkill[0];
					if(entry[1] != n || level < 4)
						return;
					
					const type = tieredSkill[2];
					console.log(type);
					linkText = tieredSkill[1].split("+");
					const link = systemData.attributes[linkText[0]].mod + (linkText.length == 2 ? systemData.attributes[linkText[1]].mod : 0);
					
					systemData.skills[entry[1]][name] = {
						xp: xp,
						mod: parseInt(level + link),
						level: level,
						link: tieredSkill[1],
						tn: parseInt(data.tn) + 1,
						type: type
					};
					served = true;
				});
				
				if(!served) {
					systemData.skills[entry[1]][name] = {
						xp: xp,
						mod: mod,
						level: level,
						link: data.link,
						tn: data.tn,
						type: data.type
					};
				}
			});
		});
		
		Object.entries(systemData.skills).forEach(entry => {
			const name = entry[0];
			const data = entry[1];
			if(customSkills.includes(name))
				return;
			
			const xp = data.xp;
			const level = this.CalcSL(xp);
			let linkText = data.link.split("+");
			const linkA = systemData.attributes[linkText[0]].mod;
			const linkB = linkText.length == 2 ? systemData.attributes[linkText[1]].mod : 0;
			const linkMod = linkA + linkB;
			const mod = level + linkMod;
			
			//Handle tiered skills
			let served = false;
			Object.entries(tieredSkills).forEach(t => {
				const tieredSkill = t[1].split(",");
				const n = tieredSkill[0];
				if(name != n || level < 4)
					return;
				
				const type = tieredSkill[2];
				linkText = tieredSkill[1].split("+");
				const link = systemData.attributes[linkText[0]].mod + (linkText.length == 2 ? systemData.attributes[linkText[1]].mod : 0);
				
				systemData.skills[name] = {
					xp: xp,
					mod: level + link,
					level: level,
					link: tieredSkill[1],
					tn: parseInt(data.tn) + 1,
					type: type
				};
				served = true;
			});
			
			if(!served) {
				systemData.skills[name] = {
					xp: xp,
					mod: mod,
					level: level,
					link: data.link,
					tn: data.tn,
					type: data.type
				};
			}
		});
	}
	
	CalculateTraitLevels(systemData) {
		const traits = systemData.traits;
		
		let updateData = {};
		let list = Object.entries(traits);
		list.forEach(tr => {
			const trait = tr[1];
			trait.level = this.CalcTP(trait.xp);
			updateData["system.traits."+tr[0]] = trait;
		});
		
		this.update(updateData);
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
			if(xp >= l)
			{
				l += (10*mult);
				sl++;
			}
			else {
				break;
			}
		}
		
		return sl;
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
		if (actorData.type !== 'vehicle')
			return;

		const systemData = actorData.system;
		const flags = actorData.flags.bt || {};
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
