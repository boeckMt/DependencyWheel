function getRequiresPackages(depsStrings, lockpackages) {
  if (!depsStrings.length) {
    return;
  }
  return depsStrings.map(key => {
    var _package = lockpackages[key];
    if (_package && _package.requires) {
      Object.keys(_package.requires).map(dep => {
        if (dep) {
          return dep;
        }
      })
    }
  })
}

var buildMatrixFromPackageJsonAndLock = function (package_json, package_json_lock, showDev) {
  /* if (!showDev) {
    showDev = false;
  } */
  var deps = [],
    requiredDeps = [],
    depsAndRequiredDeps = [],
    lockDeps = [],
    packages = [],
    lock_Packages = [],
    requiredPackages = [],
    packagesAndrequiredPackages = [];

  var devDepsCount = 0, depsCount = 0;


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
      var packageFromLock = package_json_lock.dependencies[ld];
      packageFromLock.name = ld;
      if (packageFromLock.version.match(/git/) && packageFromLock.from) {
        packageFromLock.version = packageFromLock.from.split('#')[1];
      }

      if (packageFromLock) {
        return packageFromLock;
      }
    }
  })


  if (deps.length < 1) {
    console.log('dependency not in package.json');
    return;
  } else {


    // check if deps from package.json in lock
    packages = lock_Packages.filter(lp => deps.includes(lp.name));
    console.log('dependencies', packages);

    // check if package requires other packages
    packages.map(_package => {
      if (_package.requires) {
        Object.keys(_package.requires).map(item => requiredDeps.push(item));
      }
    });


    //check for unique requiredDeps
    const uniqueSet3 = new Set(requiredDeps);
    requiredDeps = Array.from(uniqueSet3);


    requiredPackages = lock_Packages.filter(item => requiredDeps.includes(item.name));
    console.log('requiredDependencies', requiredPackages)


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
    package_json.isMain = true;
    //packages.unshift(package_json);

    var indexByName = {}
    var packageInfo = {};
    var matrix = [];
    var n = 0;
    var v = 0;
    var replaces = {};

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

        var row = matrix[source];

        if (!row) {
          row = matrix[source] = [];
          for (var i = -1; ++i < n;) row[i] = 0;

          console.log(row)
        }
        for (const packageName in p.requires) {
          row[indexByName[packageName]]++;
        }
      }
    });

    //console.log(matrix)

    // add small increment to equally weighted dependencies to force order
    matrix.forEach(function (row, index) {
      var increment = 0.001;
      for (var i = -1; ++i < n;) {
        var ii = (i + index) % n;
        if (row[ii] == 1) {
          row[ii] += increment;
          increment += 0.001;
        }
      }
    });



    return {
      matrix: matrix,
      packageNames: packageInfo
    }
  }
};
