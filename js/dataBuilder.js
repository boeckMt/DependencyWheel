/**
 * @typedef {Object} Package
 * @property {string} name
 * @property {string} version 
 * @property {Object.<string, string>} dependencies
 */


/**
 * @typedef {Object} LockPackageItem
 * @property {string} [name]
 * @property {string}[from]
 * @property {string} version
 * @property {string}resolved
 * @property {string} integrity
 * @property {boolean} dev
 * @property {Object.<string, string>} requires
 */


/**
 * @typedef {Object} PackageLock
 * @property {string} name
 * @property {string} version 
 * @property {Object.<string, LockPackageItem>} dependencies
 */






/**
 * 
 * @param {Array<string>} depsStrings 
 * @param {Array<LockPackageItem>} lockpackages
 */
function getRequiresPackages(depsStrings, lockpackages) {
  if (!depsStrings.length) {
    return;
  }
  /**
   * @type {Array<string>}
   */
  let newDepStrings = [];
  depsStrings.map(key => {
    const _package = lockpackages.find(p => p.name === key)
    if (_package) {

      if (_package.requires) {
        // console.log('find package: ', key)
        Object.keys(_package.requires).map(i => newDepStrings.push(i));
      }
    }
  })
  return newDepStrings;
}

/**
 * 
 * @param {Package} package_json 
 * @param {PackageLock} package_json_lock 
 */
var buildMatrixFromPackageJsonAndLock = function (package_json, package_json_lock) {

  /**
   * @type {Array<string>}
   */
  let deps = [],
    requiredDeps = [],
    depsAndRequiredDeps = [],
    lockDeps = [];

  /**
   * @type {Array<LockPackageItem>}
   */
  let packages = [];

  /**
   * @type {Array<LockPackageItem>}
   */
  let lock_Packages = [],
    requiredPackages = [],
    packagesAndrequiredPackages = [];

  var devDepsCount = 0,
    depsCount = 0;


  deps = Object.keys(package_json.dependencies);
  //check for unique deps
  const uniqueSet1 = new Set(deps);
  deps = Array.from(uniqueSet1);
  //------------------------


  lockDeps = Object.keys(package_json_lock.dependencies);
  //check for unique lockdeps
  const uniqueSet2 = new Set(lockDeps);
  lockDeps = Array.from(uniqueSet2);
  //------------------------


  lock_Packages = lockDeps.map(ld => {
    if (ld) {
      var pItem = package_json_lock.dependencies[ld];
      pItem.name = ld;
      if (pItem.version.match(/git/) && pItem.from) {
        pItem.version = pItem.from.split('#')[1];
      }

      if (pItem) {
        return pItem;
      }
    }
  })


  if (deps.length < 1) {
    console.log('dependency not in package.json');
    return;
  } else {


    // check if deps from package.json in lock
    packages = lock_Packages.filter(lp => deps.includes(lp.name));
    console.log('depsStrings', deps);



    // check if package requires other packages
    packages.map(p => {
      if (p.requires) {
        const newArray = Object.keys(p.requires)
        newArray.map(i => requiredDeps.push(i));
      }
    });


    /* const nextDeps = getRequiresPackages(requiredDeps, lock_Packages);
    nextDeps.map(i => requiredDeps.push(i));
    const nextDeps2 = getRequiresPackages(nextDeps, lock_Packages);
    nextDeps2.map(i => requiredDeps.push(i)); */


    //check for unique requiredDeps
    const uniqueSet3 = new Set(requiredDeps);
    requiredDeps = Array.from(uniqueSet3);

    console.log('requiredDepsStrings', requiredDeps)


    requiredPackages = lock_Packages.filter(item => requiredDeps.includes(item.name));
    //console.log('requiredPackages', requiredPackages)


    depsAndRequiredDeps = [...deps, ...requiredDeps];
    //check for unique depsAndRequiredDeps
    const uniqueSet4 = new Set(depsAndRequiredDeps);
    depsAndRequiredDeps = Array.from(uniqueSet4);



    packagesAndrequiredPackages = lock_Packages.filter(item => depsAndRequiredDeps.includes(item.name));


    console.log('all used deps', packagesAndrequiredPackages)

  }

  // packages = packages.concat(requiredPackages)
  depsCount = packages.length;

  console.log('depsCount: ', depsCount);
  console.log('devDepsCount: ', devDepsCount);


  if (!packagesAndrequiredPackages.length) {
    console.log('There are no dependencies!')
    return;
  } else {
    //packages.unshift(package_json);

    var indexByName = {}
    var packageInfo = {};
    var matrix = [];
    const _matrix = [];
    var n = 0;

    // generate packageInfo
    // Compute a unique index for each package name.
    packagesAndrequiredPackages.map((p, i) => {
      if (p) {
        const packageName = p.name;
        if (!(packageName in indexByName)) {
          const info = {
            name: packageName,
            version: p.version
          };
          packageInfo[n] = info;
          indexByName[packageName] = n++;
        }
      }
    });

    // Construct a square matrix counting package requires.
    packagesAndrequiredPackages.map((p, index) => {
      if (p) {
        var source = indexByName[p.name];

        /* matrix[source] = new Array(n).fill(0, 0, n);

        if (p.requires) {
          Object.keys(p.requires).map(p => {
            const pIndex = indexByName[p];
            if (matrix[pIndex]) {
              matrix[pIndex]++;
            }
          })
        } */

        let row, _row;
        if (!row) {
          row = matrix[source] = new Array(n).fill(0, 0, n);
        }
        if (!_row) {
          //_row = _matrix[p.name] = new Array(n).fill(0, 0, n);
          _row = _matrix[p.name] = [];
        }
        for (const packageName in p.requires) {
          row[indexByName[packageName]]++;
          //_row[indexByName[packageName]].push(packageName);
          _matrix[p.name].push(packageName)
        }
      }
    });
    console.log(_matrix)
    console.log(matrix)

    // add small increment to equally weighted dependencies to force order
    /* matrix.forEach(function (row, index) {
      var increment = 0.001;
      for (var i = -1; ++i < n;) {
        var ii = (i + index) % n;
        if (row[ii] == 1) {
          row[ii] += increment;
          increment += 0.001;
        }
      }
    }); */


    console.log('packageInfo', packageInfo)


    return {
      matrix: matrix,
      packageNames: packageInfo
    }
  }
};