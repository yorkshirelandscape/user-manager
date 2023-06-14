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

		let nonFolderCharacters = game.actors.filter((a) => 
			   !actors.map((aa) => aa.id).includes(a.id) 
			&& !a.isLoot 
			&& !a.name.startsWith('user') 
			&& a.hasPlayerOwner
		);

		nonFolderCharacters.forEach((c) => {
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
		
		actors = actors.filter((a) => Object.hasOwn(a, 'owner'));
		
		let excluded = actors.filter((a) => a?.userGroup?.name === 'User Manager Exclude').map((a) => a.owner.id);
		let users = game.users.filter((u) => !excluded.includes(u.id) && !u.isGM);
		users = users.map((u) => {
			let firstName = u.getFlag('user-manager','firstName');
		    let lastName = u.getFlag('user-manager','lastName');
		    let email = u.getFlag('user-manager','email');
		    let discord = u.getFlag('user-manager','discord');
			let dateCreated = u.getFlag('user-manager','dateCreated') === null ? null : new Date(u.getFlag('user-manager','dateCreated')).toLocaleDateString();
			let dateModified = u.getFlag('user-manager','dateModified') === null ? null : new Date(u.getFlag('user-manager','dateModified')).toLocaleDateString();
			let groups = actors.filter((a) => a.owner.id === u.id && Object.hasOwn(a, 'userGroup')).map((a) => a.userGroup );
			let groupNames = '';
			if (groups) {
				groups = [...new Map(groups.map((g) => [g.id, g])).values()];	
				groupNames = groups.map((g) => g.name).join(', '); //u.getFlag('user-manager','groups').map((g) => g.name).join(', ');
			}
			let characters = actors.filter((a) => a.owner.id === u.id);   //u.getFlag('user-manager','characters').map((c) => c.name).join(', ');
			let characterNames = characters.map((c) => c.name);
			return {
				id: u.id,
				role: u.role,
				name: u.name,
				firstName: firstName,
				lastName: lastName,
				email: email,
				discord: discord,
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
			selectedUser: null,
			actors: actors,
			users: users,
			tabs
		};
		let r = document.querySelector(":root");
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

	displaySelected(selectId) {
		console.log(selectId);
		let user = this.state.users.find((u) => u.id === selectId );
		if (!user) {
			$('#select-name').val(null);
			$('#select-role').val(null);
			$('#select-role').attr('class', '');
			$('#select-firstName').val(null);
			$('#select-lastName').val(null);
			$('#select-email').val(null);
			$('#select-discord').val(null);
			$('#select-created').html('&nbsp;');
			$('#select-modified').html('&nbsp;');
			$('#select-groups').html('');
			$('#select-characters').html(`<div class="character-box">
									<div class="character-img"><img src="systems/pf2e/icons/default-icons/character.svg"></div>
									<div class="label-character">Character</div>
								</div>`);

		} else {
			$('#select-name').val(user.name);

			let role = [null,'player','trusted-player','assistant-gm','gm'][user.role]
			$('#select-role').val(role);
			$('#select-role').attr('class', '').addClass(role);

			$('#select-firstName').val(user.firstName);
			$('#select-lastName').val(user.lastName);
			$('#select-email').val(user.email);
			$('#select-discord').val(user.discord);	
			$('#select-created').html(user.dateCreated ?? '&nbsp;');
			$('#select-modified').html(user.dateModified ?? '&nbsp;');

			let groupArr = '';
			Array.from(user.groups).forEach((g) => {
				groupArr = groupArr + `<div class="table-row"><div class="text" align="right">${g.name}</div></div>`
			})
			$('#select-groups').html(groupArr);

			let charArr = '';
			Array.from(user.characters).forEach((c) => {
				charArr = charArr + `<div class="character-box">
										<div class="character-img"><img src="${c.img}"></div>
										<div class="label-character">${c.name}</div>
									</div>`
			})
			$('#select-characters').html(charArr);			
		}
	}

	getValues(userId) {
		let uRole;
		switch ($('#select-role').val()) {
			case 'player': 
				uRole = 1;
				break;
			case 'trusted-player': 
				uRole = 2;
				break;
			case 'assistant-gm':
				uRole = 3;
				break;
			case 'gm': 
				uRole = 4;
				break;
		};
		return {
					id: userId,
					name: $('#select-name').val(),
					role: uRole,
					firstName: $('#select-firstName').val(),
					lastName: $('#select-lastName').val(),
					email: $('#select-email').val(),
					discord: $('#select-discord').val(),
					dateModified: new Date().toLocaleDateString(),
				}
	}

	async arcApply(data) {
		let user = game.users.find((u) => u.id === data.id);
		if (user) {
			console.log(data.dateModified);
			let updates = {
				name: data.name,
				role: data.role,
				'flags.user-manager.name': data.name,
				'flags.user-manager.role': data.role,
				'flags.user-manager.firstName': data.firstName,
				'flags.user-manager.lastName': data.lastName,
				'flags.user-manager.email': data.email,
				'flags.user-manager.discord': data.discord,
				'flags.user-manager.email': data.email,
				'flags.user-manager.dateModified': data.dateModified,
			}
			console.log(user.getFlag('user-manager','dateModified'));
			await user.update(updates);
			this.update();
			console.log(user.getFlag('user-manager','dateModified'));
		} else {
			ui.notifications.warn('No user selected.');
		}
	}

	redrawRow(data) {
		$(`#${data.id}-name`).text(data.name);
		$(`#${data.id}-dateModified`).text(data.dateModified);
	}

	getData() {
		this.update();
		return this.state;
	}

	activateListeners(html) {
		let self = this;
	
		$(".table-row").click(function() {
			let selectId;
			if ($(this).hasClass('selected')) {
				$(this).removeClass('selected');
				selectId = null;	
			} else {
				$(this).addClass('selected').siblings().removeClass('selected');
				selectId = $(this).attr('id');
			}
			self.displaySelected(selectId);
			self.state.selectedUser = selectId;
		});
		
		$('#select-role').on('change', function(ev) {
		    $(this).attr('class', '').addClass($(this).children(':selected').val());
		});

		$('#arc-btn-apply').on('click', async (event) => {
			let userId = self.state.selectedUser;
			let data = self.getValues(userId);
			await self.arcApply(data);
			self.redrawRow(data);
			self.state.selectedUser = userId;
		});

		$('#arc-btn-cancel').on('click', (event) => {
			self.displaySelected(self.state.selectedUser);	
		});

		super.activateListeners(html);
	}

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
