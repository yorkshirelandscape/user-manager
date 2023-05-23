class UserManagerApp extends Application {
	constructor(options) {
		super(options);
		
		this.state = {};
		this.activeTab = "active";
		this.rendering = false;
	}

	update() {
		let users = game.users.filter((u) => u.character).map((u) => ( { id: u.id, name: u.name, character: u.character.id } ) );
		const folders = game.folders.filter((f) => f.type === 'Actor' && !f.flags['user-manager']?.exclude);

		let actors = [];
		folders.forEach((f) => { 
		    let cc = f.contents.filter((c) => (!c.isLoot && !c.name.startsWith('user') && c.hasPlayerOwner))
		    cc.forEach((c) => {
		            c.userGroup = f.name;
		            c.shortName = c.name.split(/\s/).shift();
		            let owner = users.find((u) => u.character === c.id )
		            c.owner = { id: owner.id, name: owner.name };
		            actors.push(c);
		        });
		});
		// actors = actors.filter((playerActor) => users.map((u) => u.character ).includes(playerActor.id));

		let tabs = {
			active: { id: "active",  label: 'Active', visible: true },
			archive: { id: "archive", label: 'Archive', visible: true }
			 };
		
		this.state = {
			activeTab: this.activeTab,
			actors: actors,
			tabs
		};
		let r = document.querySelector(":root");
		r.style.setProperty("--user-manager-min-width", '600px');
		r.style.setProperty("--user-manager-min-height", `${78 + 33 * actors.length}px`);
	}

	static get defaultOptions() {
		return mergeObject(super.defaultOptions, {
			width: '600px',
			height: "fit-content",
			resizable: true,
			title: "User Manager",
			template: '/modules/user-manager/templates/actors.hbs',
			classes: ["user-manager-window", game.system.id],
			tabs: [
				{
					navSelector: ".tabs",
					contentSelector: ".content",
					initial: "active",
				},
			],
		});
	}

	getData() {
		this.update();
		return this.state;
	}

	// activateListeners(html) {
		// $(".btn-toggle-visibility").on("click", (event) => {
			// const actorId = event.currentTarget.dataset.actor;
			// this.hiddenActors = this.hiddenActors.includes(actorId) ? this.hiddenActors.filter((id) => id !== actorId) : [...this.hiddenActors, actorId];
			// game.settings.set("user-manager", "hiddenActors", this.hiddenActors);
			// this.render(false);
		// });
// 
		// super.activateListeners(html);
	// }

	render(force, options) {
		this.rendering = true;
		super.render(force, options);
	}

	close() {
		this.rendering = false;
		super.close();
	}
}

export default UserManagerApp;
