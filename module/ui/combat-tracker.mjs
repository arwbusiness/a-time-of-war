export class BTCombatTracker extends CombatTracker {
	/** @override */
	async getData(options={}) {
		const data = await super.getData(options);
		
		//Do whatever you gotta do here.
		if(data.combat?.tactical?.phase == "moving") {
			
		}
		else if (data.combat?.tactical?.phase == "attacking") {
			
		}
		
		return data;
	}
	
	/** @override */
	activateListeners(html) {
		//I suppose here is where I can listen for new buttons.
		html.on('dblclick', '.tactical.combatant', this.RenderCombatant.bind(this));
		
		super.activateListeners(html);
	}
	
	RenderCombatant(event) {
		const element = event.currentTarget;
		const id = element.id;
		
		if(data.combat?.turns) {
			let done = false;
			for ( let [i, combatant] of data.combat.turns.entries() ) {
				if(!done && combatant.id == id) {
					done = true;
					combatant.sheet.render(false);
				}
			}
		}
	}
}