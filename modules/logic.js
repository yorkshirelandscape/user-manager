class UserManagerApp extends Application {
	constructor(options) {
		super(options);
		
		this.state = {};
		this.activeTab = "active";
		this.rendering = false;
	}

	update() {
		let userList = game.users.filter((u) => u.character).map((u) => ( { id: u.id, name: u.name, character: u.character.id } ) );
		const folders = game.folders.filter((f) => f.type === 'Actor');

		let actors = [];
		folders.forEach((f) => { 
		    let characters = f.contents.filter((c) => (!c.isLoot && !c.name.startsWith('user') && c.hasPlayerOwner))
		    characters.forEach((c) => {
		            c.userGroup = { id: f.id, name: f.name };
		            c.shortName = c.name.split(/\s/).shift();
		            let owner = userList.find((u) => u.character === c.id )
					if (!owner) {
						owner = userList.find((u) => c.getUserLevel(u) === 3);	
					}
					if (owner) {
			            c.owner = { id: owner.id, name: owner.name };					
					}
		            actors.push(c);
		        });
		});
		actors = actors.filter((a) => Object.hasOwn(a, 'owner'));
		
		// actors = actors.filter((playerActor) => users.map((u) => u.character ).includes(playerActor.id));
		let excluded = actors.filter((a) => a.userGroup.name === 'User Manager Exclude').map((a) => a.owner.id);
		let users = game.users.filter((u) => !excluded.includes(u.id) && !u.isGM);
		users = users.map((u) => {
			let handle = u.getFlag('user-manager','handle');
		    let identifier = u.name + ( handle && handle !== u.name ? ` (${handle})` : '' );
			let dateCreated = u.getFlag('user-manager','dateCreated') === null ? null : new Date(u.getFlag('user-manager','dateCreated')).toLocaleDateString();
			let dateModified = u.getFlag('user-manager','dateModified') === null ? null : new Date(u.getFlag('user-manager','dateModified')).toLocaleDateString();
			let groups = actors.filter((a) => a.owner.id === u.id ).map((a) => a.userGroup );
			groups = [...new Map(groups.map((g) => [g.id, g])).values()];
			let groupNames = groups.map((g) => g.name).join(', '); //u.getFlag('user-manager','groups').map((g) => g.name).join(', ');
			let characters = actors.filter((a) => a.owner.id === u.id);   //u.getFlag('user-manager','characters').map((c) => c.name).join(', ');
			let characterNames = characters.map((c) => c.name);
			return {
				id: u.id,
				name: u.name,
				handle: handle,
				identifier: identifier,
				dateCreated: dateCreated,
				dateModified: dateModified,
				groups: groups,
				groupNames: groupNames,
				characters: characters,
				characterNames: characterNames,
			}
		});

		let tabs = {
			active: { id: 'active',  label: 'Active', visible: true },
			users: { id: 'users', label: 'Users', visible: true },
			characters: { id: 'characters', label: 'Characters', visible: true }
			 };
		
		this.state = {
			activeTab: this.activeTab,
			actors: actors,
			users: users,
			tabs
		};
		let r = document.querySelector(":root");
		// r.style.setProperty("--user-manager-min-width", '66%');
		// r.style.setProperty("--user-manager-min-height", '60%');
		// r.style.setProperty("--user-manager-max-height", '66%');
		// r.style.setProperty("--user-manager-max-width", '60%');
	}

	static get defaultOptions() {
		return mergeObject(super.defaultOptions, {
			width: '60%',
			height: '60%',
			resizable: true,
			title: "User Manager",
			template: '/modules/user-manager/templates/table.hbs',
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
