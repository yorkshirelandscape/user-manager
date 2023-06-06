// set blank user flags

const flagsPrototype = { 
	handle: null,
	dateCreated: null, 
	dateModified: null, 
	firstName: null, 
	lastName: null, 
	email: null,
	discord: null,
	groups: null,
	characters: {} 
};

game.users.forEach(async (u) => { 
	for (const [key, value] of Object.entries(flagsPrototype)) {
		let test = u.getFlag('user-manager', key);
		if (test === undefined) {
			await u.setFlag('user-manager', key, value );
		}
	}
});


// set actual user flags

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

let excluded = actors.filter((a) => a.userGroup.name === 'User Manager Exclude').map((a) => a.owner.id);
let users = game.users.filter((u) => !excluded.includes(u.id) && !u.isGM);
users.forEach((u) => {
	u.setFlag('user-manager','handle', u.name);
	u.setFlag('user-manager','dateCreated', Date.now());
	let groups = actors.filter((a) => a.owner.id === u.id ).map((a) => a.userGroup );
	groups = [...new Map(groups.map((g) => [g.id, g])).values()];
	u.setFlag('user-manager','groups', groups.map((g) => g.name).join(', '));
	let characters = actors.filter((a) => a.owner.id === u.id);
	u.setFlag('user-manager','characters', characters.map((c) => ( { id: c.id , name: c.name } )));
});

// define a new group

let user = Array.from(game.users)[19]
let groups = user.getFlag('user-manager', 'groups');
let group = { name: 'Test Group', dateJoined: Date.now() };
if (groups === null) {
	let newGroups = [];
	newGroups.push(group);
	groups = newGroups;
} else { 
	groups.push(group);
}
await user.setFlag('user-manager', 'groups', groups);
