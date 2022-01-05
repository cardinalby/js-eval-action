// comment 1
/*
* comment 2
*/
(async () => {
    return new Promise(resolve => { setTimeout(() => {
        core.setSecret("sa5464dad");
        resolve(22)
    }, 10) });
})()
// comment 3
/*
* comment 4
*/