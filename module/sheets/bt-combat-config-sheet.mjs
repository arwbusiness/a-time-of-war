/** @extends {CombatTrackerConfig} */
export class BTCombatTrackerConfig extends CombatTrackerConfig {
	/** @override */
	get template() {
		const path = 'systems/a-time-of-war/templates/sheets';
		// Return a single sheet for all item types.
		return `${path}/combat-config.html`;

		// Alternatively, you could use the following return statement to do a
		// unique item sheet by type, like `weapon-sheet.hbs`.
		//return `${path}/bt-${this.item.type}-sheet.hbs`;
	}
}
