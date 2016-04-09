/* global _ */
/* global Base64 */
/* global LZString */
(function () {
    angular.module('app').controller('MainController', MainController);

    MainController.$inject = ['$scope', '$window', '$timeout',
        'ConfigurationService', 'MapService',
        'HouseService', 'TrackService', 'TrackTokenService',
        'GarrisonsService', 'OrdersService', 'UnitsService', 'TracksService', 'PTsService', 'CardsService', 'MarkersService'];

    function MainController($scope, $window, $timeout,
        Configuration, Map,
        House, Track, TrackToken,
        Garrisons, Orders, Units, Tracks, PTs, Cards, Markers) {

        var vm = this;

        vm.showUnits = true;
        vm.showOrders = true;
        vm.showPowerTokens = true;

        vm.round = 1;
        vm.wildlingPower = 2;
        vm.garrisons = [];

        vm.increaseWildlingPower = increaseWildlingPower;
        vm.increaseRound = increaseRound;

        initialize();
        initializeWatchers();

        readConfigFromUrl();

        function initialize() {
            vm.houses = {
                baratheon: new House('Baratheon', 'dragonstone'),
                greyjoy: new House('Greyjoy', 'pyke'),
                lannister: new House('Lannister', 'lannisport'),
                martell: new House('Martell', 'sunspear'),
                stark: new House('Stark', 'winterfell'),
                tyrell: new House('Tyrell', 'highgarden'),
            };

            vm.trackTokens = {
                IT: new TrackToken('Iron Throne', 'throne', false),
                vsb: new TrackToken('Valyrian Steel Blade', 'fiefdom', true),
                raven: new TrackToken('Raven', 'court', true),
            };

            vm.tracks = {
                it: new Track('Iron Throne', vm.trackTokens.IT),
                f: new Track('Fiefdoms', vm.trackTokens.vsb),
                kc: new Track('King\'s Court', vm.trackTokens.raven),
            };
        }

        function initializeWatchers() {
            angular.forEach(vm.houses, function (house) {
                $scope.$watch(
                    function () { return house.unitsText; },
                    function () {
                        house.setUnits(Units.parse(house.unitsText));
                        updateHash();
                    });

                $scope.$watch(
                    function () { return house.ordersText; },
                    function () {
                        house.setOrders(Orders.parse(house.ordersText));
                        updateHash();
                    });

                $scope.$watch(
                    function () { return house.ptsText; },
                    function () {
                        house.setPTs(PTs.parse(house.ptsText));
                        updateHash();
                    });

                $scope.$watch(
                    function () { return house.cardsImages; },
                    function () {
                        house.setCardImages(Cards.parse(house.cardsImages));
                        updateHash();
                    });
                    
                $scope.$watch(
                    function () { return house.cardsTracking; },
                    function () {
                        updateHash();
                    }, true);
                    
                $scope.$watch(
                    function () { return house.ownedPowerTokens; },
                    function () {
                        updateHash();
                    });
            });

            angular.forEach(vm.tracks, function (track) {
                $scope.$watch(
                    function () { return track.positionsText; },
                    function () {
                        track.positions = Tracks.parse(track.positionsText);
                        updateHash();
                    });
            });

            $scope.$watch(
                function () { return vm.supplyText; },
                function () {
                    vm.supply = Markers.parse(vm.supplyText);
                    updateHash();
                });

            $scope.$watch(
                function () { return vm.victoryText; },
                function () {
                    vm.victory = Markers.parse(vm.victoryText);
                    updateHash();
                });
                
            $scope.$watch(
                function () { return vm.garrisonsText; },
                function () {
                    vm.garrisons = Garrisons.parse(vm.garrisonsText);
                    updateHash();
                });
                
            $scope.$watch(
                function () { return vm.wildlingPower; },
                function () {
                    updateHash();
                });
                
            $scope.$watch(
                function () { return vm.round; },
                function () {
                    updateHash();
                });
                
            $scope.$watch(
                function () { return vm.trackTokens.vsb.isUsed; },
                function () {
                    updateHash();
                });
                
            $scope.$watch(
                function () { return vm.trackTokens.raven.isUsed; },
                function () {
                    updateHash();
                });
        }

        function readConfigFromUrl() {
            var hash = location.hash;
            if (hash.indexOf('#') === 0) {
                hash = hash.substr(1);
            }
            if (hash.length > 0) {
                var conf;
                try {
                    // try to see if we already have JSON (from older versions of the link)
                    conf = JSON.parse(decodeURIComponent(hash));

                } catch (e) {
                    // nope, lets do the decode and decompress routine
                    conf = JSON.parse(LZString.decompress(Base64.urlSafeDecode(hash)));
                }

                Configuration.setVMFromConf(vm, conf);
            } else {
                throw 'No Conf in hash';
            }
        }

        function increaseWildlingPower() {
            if (vm.wildlingPower < 12) {
                vm.wildlingPower += 2;
            } else {
                vm.wildlingPower = 0;
            }
        }

        function increaseRound() {
            if (vm.round < 10) {
                vm.round++;
            }
        }

        function updateHash() {
            if (vm.updateHashPromise)
                $timeout.cancel(vm.updateHashPromise);
            vm.updateHashPromise = $timeout(doUpdateHash, 1000);
        }
        
        function doUpdateHash() {
            var hash = Base64.urlSafeEncode(LZString.compress(JSON.stringify(Configuration.getConfFromVM(vm))));
            location.hash = hash;
            setShortLink(location.href);
            
            // clean the promise reference
            vm.updateHashPromise = null;
        }

        function setShortLink(href) {
            var characters = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789',
                str = '',
                charCnt = 20,
                uri;
                
            for (var i = 0; i < charCnt; i += 1) {
                str += characters[Math.floor(Math.random() * characters.length)];
            }
            
            uri = 'http://tinyurl.com/create.php?source=indexpage&url=' + encodeURIComponent(href) + '&alias=' + str;
            var img = angular.element('<img src="' + uri + '" style="height: 1px; width: 1px; position: absolute; z-index: -999; opacity: 0;" />');
            var body = angular.element($window.document.body);
            body.append(img);
            
            vm.shortLink = 'http://tinyurl.com/' + str;
        }
        
        vm.cleanRaids = cleanRaids;
        vm.cleanCombat = cleanCombat;
        vm.resolveCPs = resolveCPs;
        vm.cleanCPs = cleanCPs;
        vm.updateVictory = updateVictory;
        vm.updateSupply = updateSupply;
        vm.gameOfThrones = gameOfThrones;
        vm.validateOrders = validateOrders;
        
        function resolveCPs() {
            var summary = {};
            
            angular.forEach(vm.houses, function(house) {
                var ptsGained = resolveCPsByHouse(house) ;
                summary[house._name] = ptsGained;
            });
            
            if (confirm('This are the power token gained by each house:\n' + summaryToString(summary) + '\nDo you wish to add to the houses?')) {
                angular.forEach(summary, function(ptsGained, houseName) {
                    vm.houses[houseName].gainPowerToken(ptsGained);
                });
            }
        }
        
        function resolveCPsByHouse(house) {
            var ptsGained = _.chain(house.orders)
                                .filter(function(token) { return token.order == 'power-1'; })
                                .reduce(function(result, token) { 
                                    var area = Map[token.area];
                                    
                                    if (area.landType == 'sea') {
                                        return result;
                                    }
                                    
                                    if (isHarborSurrounded(token.area, house._name)) {
                                        return result;
                                    }
                                    
                                    return result + 1 + area.crown;
                                }, 0).value();
                                
            return ptsGained;
        }
        
        function isHarbor(area) {
            if (typeof area == 'string')
                area = Map[area];
            
            return _.has(area, 'surroundingSea');
        }
        
        function isHarborSurrounded(area, checkedHouse) {
            if (typeof area == 'string')
                area = Map[area];
            
            if (!_.has(area, 'surroundingSea'))
                return false;
            
            var unitsThatSurround = _.chain(vm.houses)
                                    .filter(function(house) {
                                        return house._name != checkedHouse
                                    })
                                    .map(function(house) { 
                                        return house.units;
                                    })
                                    .flatten()
                                    .filter(function(unit) {
                                        return unit.area == area.surroundingSea;
                                    }).value();
            
            return unitsThatSurround.length > 0;
        }
        
        function summaryToString(summary) {
            return _.reduce(summary, function(text, pts, houseName) {
                var house = vm.houses[houseName];
                return text + house.name + ' +' + pts + ' -> ' + Math.min(house.maxPowerTokens, house.ownedPowerTokens + pts) + '\n';
            }, '');
        }
        
        function cleanRaids() {
            angular.forEach(vm.houses, function(house) {
                var orders = house.orders;
                
                cleanOrdersByHouse(orders, 'raid-1');
                cleanOrdersByHouse(orders, 'raid-2');
                
                house.ordersText = Orders.toText(orders);
            });
        }
        
        function cleanOrdersByHouse(orders, orderToRemove) {
            angular.forEach(_.filter(orders, function(token) { return token.order == orderToRemove }), function (token) {
               token.order = ''; 
            });
        }
        
        function cleanCombat() {
            angular.forEach(vm.houses, function(house) {
                var orders = house.orders;
                
                cleanOrdersByHouse(orders, 'march-0');
                cleanOrdersByHouse(orders, 'march-1');
                cleanOrdersByHouse(orders, 'march-2');
                cleanOrdersByHouse(orders, 'support-1');
                cleanOrdersByHouse(orders, 'support-2');
                cleanOrdersByHouse(orders, 'defend-1');
                cleanOrdersByHouse(orders, 'defend-2');
                
                house.ordersText = Orders.toText(orders);
            });
        }
        
        function cleanCPs() {
            angular.forEach(vm.houses, function(house) {
                var orders = house.orders;

                cleanOrdersByHouse(orders, 'power-1');
                
                house.ordersText = Orders.toText(orders);
            });
        }
        
        function updateVictory() {
            var summary = {};
            
            angular.forEach(vm.houses, function(house) {
                var houseVPs = countAreaPointByHouse(house, function(area) { return area.castle > 0 || area.stronghold > 0 ? 1 : 0 });
                summary[house._name] = houseVPs;
            });
            
            if (confirm('This are the new Victory Points:\n' + vpSummaryToString(summary) + '\nDo you wish to update the track?')) {
                vm.victoryText = Markers.toText(summary);
            }
        }
        
        function isAreaEmpty(areaName) {
            var areasWithUnits = _.chain(vm.houses)
                                   .map(function(house) { 
                                       return house.units;
                                   })
                                   .flatten()
                                   .map('area')
                                   .value();
                                   
            var areasWithPT = _.chain(vm.houses)
                               .map(function(house) { 
                                    return house.consolidatedAreas;
                                })
                                .flatten()
                                .value();
                                
            var count = _.chain(areasWithUnits)
                    .union(areasWithPT)
                    .filter(function(area) {
                        return area == areaName
                    })
                    .value()
                    .length;
                    
            return count == 0;
        }
        
        function vpSummaryToString(summary) {
            return _.reduce(summary, function(text, vps, houseName) {
                var house = vm.houses[houseName];
                
                var previousVP = vm.victory[houseName];
                
                return text + house.name + ' from ' + previousVP + ' -> ' + vps + '\n';
            }, '');
        }
        
        function updateSupply() {
            var summary = {};
            
            angular.forEach(vm.houses, function(house) {
                var houseSupplies = countAreaPointByHouse(house, function(area) { return area.barrel; });
                summary[house._name] = houseSupplies;
            });
            
            if (confirm('This are the new Supply Points:\n' + spSummaryToString(summary) + '\nDo you wish to update the track?')) {
                vm.supplyText = Markers.toText(summary);
            }
        }
        
        function countAreaPointByHouse(house, countFunction) {
            var uniqAreas = _.union(_.map(house.units, 'area'), house.consolidatedAreas);
            
            if (isAreaEmpty(house.capital)) {
                uniqAreas = _.union(uniqAreas, [house.capital]);
            }
            
            var points = _.reduce(uniqAreas, function(count, areaName) {
                                var area = Map[areaName];
                                return count + countFunction(area, house);
                            }, 0);
            
            return points;
        }
        
        function spSummaryToString(summary) {
            return _.reduce(summary, function(text, count, houseName) {
                var house = vm.houses[houseName];
                
                var previousSP = vm.supply[houseName];
                
                return text + house.name + ' from ' + previousSP + ' -> ' + count + '\n';
            }, '');
        }
        
        function gameOfThrones(house) {
            var summary = {};
            
            angular.forEach(vm.houses, function(house) {
                var ptsGained = countAreaPointByHouse(house, countPTsByArea);
                summary[house._name] = ptsGained;
            });
            
            if (confirm('This are the power token gained by each house:\n' + summaryToString(summary) + '\nDo you wish to add to the houses?')) {
                angular.forEach(summary, function(ptsGained, houseName) {
                    vm.houses[houseName].gainPowerToken(ptsGained);
                });
            }
        }
        
        function countPTsByArea(area, house) {
            return isHarbor(area) && !isHarborSurrounded(area, house._name) ? 1 : area.crown;
        }
        
        function validateOrders() {
            var stars = [3, 3, 2, 1, 0, 0];
            
            angular.forEach(vm.tracks.kc.positions, function(houseName, index) {
                var house = vm.houses[houseName];
                var maxAllowed = stars[index];
                
                if (getOrdersCount(house, isStarredOrder) > maxAllowed) {
                    alert('House ' + house.name + ' has more starred orders than allowed!');
                }
                
                if (vm.deck3effectCard != vm.deck3cards.none) {
                    var restrictedOrder = vm.deck3effectCard.order;
                    
                    if (getOrdersCount(house, function (orderToken) { return checkOrder(orderToken, restrictedOrder); }) > 0) {
                        alert('House ' + house.name + ' has restricted orders!');
                    }
                }
                
                angular.forEach(_.groupBy(house.orders, 'order'), function(orders, orderType) {
                    if (orders.length > Orders.dict[orderType].max) {
                        alert('House ' + house.name + ' has more ' + orderType + ' orders than allowed!');
                    }
                })
                
            });
        }
        
        function checkOrder(token, orderTemplate) {
            return token.order.indexOf(orderTemplate) >= 0;
        }
        
        function getOrdersCount(house, orderPredicate) {
            return _.filter(house.orders, function(token) { return orderPredicate(token); }).length;
        }
        
        function isStarredOrder(token) {
            return token.order.indexOf('-2') >= 0;
        }
        
        vm.deck3cards = {
            none: { name: 'None', description: 'No restrictions' },
            SoStorms: { name: 'Sea of Storms', description: 'No Raid orders', order: 'raid' },
            RoA: { name: 'Rains of Autumn', description: 'No March+1* orders', order: 'march' },
            FfC: { name: 'Feast for Crows', description: 'No Consolidate Power orders', order: 'power' },
            WoL: { name: 'Web of Lies', description: 'No Support orders', order: 'support' },
            SoSwords: { name: 'Storm of Swords', description: 'No Defense orders', order: 'defend' }
        };

        vm.deck3effectCard = vm.deck3cards.none;

        vm.validateUnits = validateUnits;

        function validateUnits() {
            validateMaximumUnits();
            validateSupplyUnits();
        }

        function validateMaximumUnits() {
            var unitLimits = {
                knight: 5,
                footman: 10,
                siege: 2,
                ship: 6,
            };

            angular.forEach(vm.houses, function (house) {
                var unitsAboveLimit = getUnitsAboveLimits(house, unitLimits);

                if (unitsAboveLimit.length > 0) {

                    var unitTypes = _.chain(unitsAboveLimit).map(function (x) { return x.count + ': ' + x.unitType; }).join(', ').value();

                    alert('House ' + house.name + ' has more (' + unitTypes + ') than allowed!');
                }
            });
        }
        
        function getUnitsAboveLimits(house, unitLimits) {
             return _.chain(house.units)
                    .groupBy('unit')
                    .map(function (units, unitType) {
                        return { unitType: unitType, count: units.length }
                    })
                    .filter(function (x) {
                        return x.count > unitLimits[x.unitType];
                    })
                    .value();
        }

        function validateSupplyUnits(house) {
            var supplyLimitsText = ['   22',
                '   32',
                '  322',
                ' 3222',
                ' 3322',
                ' 4322',
                '43222'];

            var supplyLimits = convertSupplyTextToDict(supplyLimitsText);

            angular.forEach(vm.houses, function (house) {
                var unitsAboveLimit = getArmiesAboveSupply(house, supplyLimits);

                if (unitsAboveLimit.length > 0) {
                    var areas = _.chain(unitsAboveLimit)
                        .flatMap('areas')
                        .map(function (areaName) { return Map[areaName].name; })
                        .join(', ')
                        .value();

                    alert('House ' + house.name + ' has more units than supply limits allow in the areas: ' + areas);
                }
            });
        }

        function getArmiesAboveSupply(house, supplyLimits) {
            var supplyCount = vm.supply[house._name];
            var houseSupplyLimits = supplyLimits[supplyCount];

            return _.chain(house.units)
                .groupBy('area')
                .map(function (units, areaName) {
                    return { areaName: areaName, armySize: units.length };
                })
                .groupBy('armySize')
                .map(function (areas, armySize) {
                    return {
                        armySize: parseInt(armySize),
                        countAreas: areas.length,
                        areas: _.map(areas, 'areaName')
                    };
                })
                .orderBy('armySize', 'desc')
                .filter(function (x) {
                    if (x.armySize <= 1)
                        return false;

                    if (!(x.armySize in houseSupplyLimits))
                        return true;

                    return x.countAreas > houseSupplyLimits[x.armySize];
                })
                .value();
        }

        function convertSupplyTextToDict(supplyLimitsText) {
            return _.chain(supplyLimitsText)
                .map(function (x) { return x.trim(); })
                .map(function (item) {

                    var nji = {};

                    angular.forEach(_.groupBy(item), function (limits, armySize) {
                        nji[parseInt(armySize)] = limits.length;
                    });

                    return nji;
                })
                .value();
        }
    }

})();




