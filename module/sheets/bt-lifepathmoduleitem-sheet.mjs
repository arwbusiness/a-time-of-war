/**
 * Extend the basic ItemSheet with some very simple modifications
 * @extends {ItemSheet}
 */
export class BTLifepathModuleItemSheet extends ItemSheet {
  /** @override */
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ['bt', 'sheet', 'item', 'lifepath_module'],
      width: 500,
      height: 400,
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
		return `systems/a-time-of-war/templates/item/LifepathModuleItemSheet.hbs`;
	}
	
	/** @override */
	async getData() {
		const context = super.getData();
		
		//Use a safe clone of the actor data for further operations from here.
		const itemData = this.document.toObject(false);
		const systemData = itemData.system;
		
		context.system = itemData.systemData;
		context.flags = itemData.flags;
		context.config = CONFIG.BT;
		
		this.PrepareDerivedData(itemData, systemData);
		
		return context;
	}
	
	PrepareDerivedData(itemData, systemData) {
		
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
	
	/** @override */
	activateListeners(html) {
		super.activateListeners(html);
		
		if(!this.isEditable)
			return;
		
		html.on('change', '#module-type', this.ChangeModuleType.bind(this));
		html.on('blur', '#description', this.ChangeTextArea.bind(this));
		html.on('blur', '#flex', this.ChangeTextArea.bind(this));
		html.on('change', '.subtitle', this.ChangeSubtitle.bind(this));
		html.on('change', '.xp', this.ChangeXP.bind(this));
		html.on('click', '.add', this.AddXP.bind(this));
		html.on('click', '.delete', this.DeleteXP.bind(this));
		
		this.SetSelectIndexes();
	}
	
	ChangeModuleType(event) {
		const element = event.currentTarget;
		const value = element.value;
		
		//Update the system
		let updateData = {};
		updateData["system.type"] = value;
		console.log(updateData);
		this.item.update(updateData);
		//this.render();
	}
	
	ChangeTextArea(event) {
		const element = event.currentTarget;
		const id = element.id;
		const value = element.value;
		
		let updateData = {};
		updateData["system." + id] = value;
		this.item.update(updateData);
		//No need to re-render.
	}
	
	ChangeSubtitle(event) {
		const element = event.currentTarget;
		const type = element.id.split("@")[0];
		const id = element.id.split("@")[1];
		const value = element.value;
		
		let updateData = {};
		updateData["system." + type + "s." + id + ".subtitle"] = value;
		this.item.update(updateData);
	}
	
	ChangeXP(event) {
		const element = event.currentTarget;
		const type = element.id.split("@")[0];
		const id = element.id.split("@")[1];
		const value = element.value;
		
		let updateData = {};
		updateData["system." + type + "s." + id + ".xp"] = parseInt(value);
		this.item.update(updateData);
		this.CountXP();
	}
	
	AddXP(event) {
		const type = event.currentTarget.id;
		const element = $('#select-' + type)[0];
		const value = element.value;
		
		const customSkills = ["art", "career", "interest", "language", "protocol", "science", "streetwise", "survival"];
		const customTraits = ['alternate_id', 'bloodmark', 'citizenship', 'compulsion', 'connections', 'custom_vehicle', 'dark_secret', 'dependents', 'design_quirk', 'enemy', 'exceptional_attribute', 'extra, income', 'implant_prosthetic', 'in_for_life', 'lost_limb', 'natural_aptitude', 'property', 'rank', 'reputation', 'title', 'vehicle'];
		let updateData = {};
		const uuid = this.UUID();
		updateData["system." + type + "s." + uuid] = {
			id: uuid,
			name: value,
			xp: 0,
			hasSubtitle: (type == "skill" ? customSkills.includes(value) : type == "trait" ? customTraits.includes(value) : false),
			subtitle: ""
		};
		
		this.item.update(updateData);
		this.CountXP();
	}
	
	async DeleteXP(event) {
		const element = event.currentTarget;
		const type = element.id.split("@")[0];
		const id = element.id.split("@")[1];
		
		if(type == "attribute") {
			const list = foundry.utils.duplicate(this.item.system.attributes);
			
			let updateData = {};
			let target = "system.attributes";
			updateData[target] = [];
			await this.item.update(updateData);
			
			updateData = {};
			Object.entries(list).forEach(entry => {
				let i = entry[0];
				if(i == id)
					return;
				
				let data = entry[1];
				updateData[target + "." + i] = data;
			});
			
			await this.item.update(updateData);
			await this.CountXP();
		}
		else if(type == "skill") {
			const list = foundry.utils.duplicate(this.item.system.skills);
			
			let updateData = {};
			let target = "system.skills";
			updateData[target] = [];
			await this.item.update(updateData);
			
			updateData = {};
			Object.entries(list).forEach(entry => {
				let i = entry[0];
				if(i == id)
					return;
				
				let data = entry[1];
				updateData[target + "." + i] = data;
			});
			
			await this.item.update(updateData);
			await this.CountXP();
		}
		else if(type == "trait") {
			const list = foundry.utils.duplicate(this.item.system.traits);
			
			let updateData = {};
			let target = "system.traits";
			updateData[target] = [];
			await this.item.update(updateData);
			
			updateData = {};
			Object.entries(list).forEach(entry => {
				let i = entry[0];
				if(i == id)
					return;
				
				let data = entry[1];
				updateData[target + "." + i] = data;
			});
			
			await this.item.update(updateData);
			await this.CountXP();
		}
	}
	
	async CountXP() {
		let list = $(".xp");
		
		let updateData = {};
		let xp = 0;
		for(var i = 0; i < list.length; i++) {
			xp += parseInt(list[i].value);
		}
		updateData["system.cost"] = xp;
		await this.item.update(updateData);
	}
	
	SetSelectIndexes() {
		const systemData = this.item.system;
		
		//First, module-type
		let typeList = document.getElementById("module-type");
		switch(systemData.type) {
			case "affiliation":
				typeList.selectedIndex = 0;
				break;
			case "subaffiliation":
				typeList.selectedIndex = 1;
				break;
			case "early_childhood":
				typeList.selectedIndex = 2;
				break;
			case "late_childhood":
				typeList.selectedIndex = 3;
				break;
			case "schooling":
				typeList.selectedIndex = 4;
				break;
			case "adult_life":
				typeList.selectedIndex = 5;
				break;
			default:
				break;
		}
	}
}
