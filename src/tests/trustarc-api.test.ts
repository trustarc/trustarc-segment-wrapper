import {
    getTrustArcGlobal,
    getNormalizedActiveGroupIds,
    getNormalizedCategories,
    coerceConsentModel,
    TrustArcGlobal,
    TaConsentModel,
    getAllCategories,
} from '../lib/trustarc-api'
describe("getTrustArcGlobal", () => {
    test('should return "undefined" when TrustArcs global is not available', () => {
        const trustArcGlobal = getTrustArcGlobal();
        expect(trustArcGlobal).toBeUndefined();
    });

    test('Should populate TrustArc Global properly', () => {

        // Mock the window.truste global variable
        window.truste = {
            eu: {
                bindMap: {
                    behaviorManager: TaConsentModel.eu,
                    categoryCount: 4,
                    domain: "test.com"
                }
            }, 
            cma: {
                callApi: jest.fn()
            }
        };

        const mockCallApi = jest.spyOn(window.truste.cma, 'callApi');
        const trustArcGlobal = getTrustArcGlobal();
        trustArcGlobal?.cma.callApi("a", "b");

        expect(trustArcGlobal?.eu.bindMap.categoryCount).toBe(4);
        expect(trustArcGlobal?.eu.bindMap.behaviorManager).toBe("eu");
        expect(trustArcGlobal?.eu.bindMap.domain).toBe("test.com");
        expect(mockCallApi).toHaveBeenCalled();
    });

    afterEach(() => {
        jest.resetAllMocks();
        window.truste = undefined; // Or null, depending on how you want to reset it
    });
});

describe("coerceConsentModel", () => {
    test('Should return opt-in when the behavior value is eu', () => {
        expect(coerceConsentModel("eu")).toBe("opt-in");
    });

    test('Should return opt-out when the behavior value is us', () => {
        expect(coerceConsentModel("us")).toBe("opt-out");
    });

    test('Should return opt-in when the behavior value is different from us or eu', () => {
        expect(coerceConsentModel("somerandomstring")).toBe("opt-in");
    });

    test('Should return opt-out when the behavior value is implied', () => {
        expect(coerceConsentModel("implied")).toBe("opt-out");
    });

    test('Should return opt-in when the behavior value is expressed', () => {
        expect(coerceConsentModel("expressed")).toBe("opt-in");
    });
});


describe("getAllCategories", () => {
    test('Should return correct category values when having 4 categories', () => {
         // Mock the window.truste global variable
         window.truste = {
            eu: {
                bindMap: {
                    behaviorManager: TaConsentModel.eu,
                    categoryCount: 4,
                    domain: "test.com"
                }
            }, 
            cma: {
                callApi: jest.fn()
            }
        };

        const allCategories = getAllCategories();

        expect(allCategories.length).toBe(4);
        expect(allCategories[0].groupId).toBe("ta-1");
        expect(allCategories[1].groupId).toBe("ta-2");
        expect(allCategories[2].groupId).toBe("ta-3");
        expect(allCategories[3].groupId).toBe("ta-4");
    });

    test('Should return correct category values when having 1 category', () => {
        // Mock the window.truste global variable
        window.truste = {
           eu: {
               bindMap: {
                   behaviorManager: TaConsentModel.eu,
                   categoryCount: 1,
                   domain: "test.com"
               }
           }, 
           cma: {
               callApi: jest.fn()
           }
       };

       const allCategories = getAllCategories();

       expect(allCategories.length).toBe(1);
       expect(allCategories[0].groupId).toBe("ta-1");
    });

   test('Should return correct category values when having 0 categories', () => {
        // Mock the window.truste global variable
        window.truste = {
        eu: {
            bindMap: {
                behaviorManager: TaConsentModel.eu,
                categoryCount: 0,
                domain: "test.com"
            }
        }, 
        cma: {
            callApi: jest.fn()
        }
        };

        const allCategories = getAllCategories();

        expect(allCategories.length).toBe(0);
    });

    test('Should return empty when TrustArc Global is undefined', () => {
        const allCategories = getAllCategories();
        expect(allCategories.length).toBe(0);
    });

    afterEach(() => {
        jest.resetAllMocks();
        window.truste = undefined; // Or null, depending on how you want to reset it
    });
});

describe("getNormalizedActiveGroupIds", () => {
    test('when having 4 categories, all accepted and consent is asserted', () => {
         // Mock the window.truste global variable
         window.truste = {
            eu: {
                bindMap: {
                    behaviorManager: TaConsentModel.eu,
                    categoryCount: 4,
                    domain: "test.com"
                }
            }, 
            cma: {
                callApi: (a: string, b: string) => {
                    return {
                        source: "asserted", 
                        consentDecision: [1, 2, 3, 4]
                    }
                }
            }
        };

        const trustArcActiveGroups = getNormalizedActiveGroupIds("eu");

        expect(trustArcActiveGroups.length).toBe(4);
        expect(trustArcActiveGroups[0]).toBe("ta-1");
        expect(trustArcActiveGroups[1]).toBe("ta-2");
        expect(trustArcActiveGroups[2]).toBe("ta-3");
        expect(trustArcActiveGroups[3]).toBe("ta-4");
    });

    test('when having 4 categories, consent is implied (not given yet) and consent model is opt-in', () => {
        // Mock the window.truste global variable
        window.truste = {
           eu: {
               bindMap: {
                   behaviorManager: TaConsentModel.eu,
                   categoryCount: 4,
                   domain: "test.com"
               }
           }, 
           cma: {
               callApi: (a: string, b: string) => {
                   return {
                       source: "implied", 
                       consentDecision: [0]
                   }
               }
           }
       };

       const trustArcActiveGroups = getNormalizedActiveGroupIds("opt-in");

       // We only expect the fist category to be active as consent is not yet given
       expect(trustArcActiveGroups.length).toBe(1);
       expect(trustArcActiveGroups[0]).toBe("ta-1");
   });

   test('when having 3 categories, consent is implied (not given yet) and consent model is opt-in', () => {
    // Mock the window.truste global variable
    window.truste = {
       eu: {
           bindMap: {
               behaviorManager: TaConsentModel.eu,
               categoryCount: 3,
               domain: "test.com"
           }
       }, 
       cma: {
           callApi: (a: string, b: string) => {
               return {
                   source: "implied", 
                   consentDecision: [0]
               }
           }
       }
   };

   const trustArcActiveGroups = getNormalizedActiveGroupIds("opt-out");

   // We expect all 4 categories to be active as consent is not yet given and consent model is opt-out
   expect(trustArcActiveGroups.length).toBe(3);
   expect(trustArcActiveGroups[0]).toBe("ta-1");
   expect(trustArcActiveGroups[1]).toBe("ta-2");
   expect(trustArcActiveGroups[2]).toBe("ta-3");
});

test('when having 3 categories, 1 and 3 accepted and consent model is opt-in', () => {
    // Mock the window.truste global variable
    window.truste = {
       eu: {
           bindMap: {
               behaviorManager: TaConsentModel.eu,
               categoryCount: 3,
               domain: "test.com"
           }
       }, 
       cma: {
           callApi: (a: string, b: string) => {
               return {
                   source: "asserted", 
                   consentDecision: [1, 3]
               }
           }
       }
   };

   const trustArcActiveGroups = getNormalizedActiveGroupIds("opt-in");

   expect(trustArcActiveGroups.length).toBe(2);
   expect(trustArcActiveGroups[0]).toBe("ta-1");
   expect(trustArcActiveGroups[1]).toBe("ta-3");
});

test('when having 3 categories, 1 and 3 accepted and consent model is opt-out', () => {
    // Mock the window.truste global variable
    window.truste = {
       eu: {
           bindMap: {
               behaviorManager: TaConsentModel.eu,
               categoryCount: 3,
               domain: "test.com"
           }
       }, 
       cma: {
           callApi: (a: string, b: string) => {
               return {
                   source: "asserted", 
                   consentDecision: [1, 3]
               }
           }
       }
   };

   const trustArcActiveGroups = getNormalizedActiveGroupIds("opt-out");

   expect(trustArcActiveGroups.length).toBe(2);
   expect(trustArcActiveGroups[0]).toBe("ta-1");
   expect(trustArcActiveGroups[1]).toBe("ta-3");
});

    afterEach(() => {
        jest.resetAllMocks();
        window.truste = undefined; // Or null, depending on how you want to reset it
    });
});

describe("getNormalizedCategories", () => {
    test('when having 3 categories, 1 and 3 accepted and consent model is opt-out', () => {
        // Mock the window.truste global variable
        window.truste = {
           eu: {
               bindMap: {
                   behaviorManager: TaConsentModel.eu,
                   categoryCount: 3,
                   domain: "test.com"
               }
           }, 
           cma: {
               callApi: (a: string, b: string) => {
                   return {
                       source: "asserted", 
                       consentDecision: [1, 3]
                   }
               }
           }
       };
    
       const trustArcActiveGroups = getNormalizedCategories("opt-out");
    
       expect(trustArcActiveGroups).toEqual({
            "ta-1": true,
            "ta-2": false,
            "ta-3": true,
       });
    });

    test('when having 3 categories, 1 and 3 accepted and consent model is opt-in', () => {
        // Mock the window.truste global variable
        window.truste = {
           eu: {
               bindMap: {
                   behaviorManager: TaConsentModel.eu,
                   categoryCount: 3,
                   domain: "test.com"
               }
           }, 
           cma: {
               callApi: (a: string, b: string) => {
                   return {
                       source: "asserted", 
                       consentDecision: [1, 3]
                   }
               }
           }
       };
    
       const trustArcActiveGroups = getNormalizedCategories("opt-in");
    
       expect(trustArcActiveGroups).toEqual({
            "ta-1": true,
            "ta-2": false,
            "ta-3": true,
       });
    });

    test('when having 4 categories, all accepted and consent model is opt-in', () => {
        // Mock the window.truste global variable
        window.truste = {
           eu: {
               bindMap: {
                   behaviorManager: TaConsentModel.eu,
                   categoryCount: 4,
                   domain: "test.com"
               }
           }, 
           cma: {
               callApi: (a: string, b: string) => {
                   return {
                       source: "asserted", 
                       consentDecision: [1, 2, 3, 4]
                   }
               }
           }
       };
    
       const trustArcActiveGroups = getNormalizedCategories("opt-in");
    
       expect(trustArcActiveGroups).toEqual({
            "ta-1": true,
            "ta-2": true,
            "ta-3": true,
            "ta-4": true,
       });
    });

    test('when having 4 categories, not accepted and consent model is opt-in', () => {
        // Mock the window.truste global variable
        window.truste = {
           eu: {
               bindMap: {
                   behaviorManager: TaConsentModel.eu,
                   categoryCount: 4,
                   domain: "test.com"
               }
           }, 
           cma: {
               callApi: (a: string, b: string) => {
                   return {
                       source: "implied", 
                       consentDecision: [0]
                   }
               }
           }
       };
    
       const trustArcActiveGroups = getNormalizedCategories("opt-in");
    
       expect(trustArcActiveGroups).toEqual({
            "ta-1": true,
            "ta-2": false,
            "ta-3": false,
            "ta-4": false,
       });
    });

    test('when having 4 categories, not accepted and consent model is opt-out', () => {
        // Mock the window.truste global variable
        window.truste = {
           eu: {
               bindMap: {
                   behaviorManager: TaConsentModel.eu,
                   categoryCount: 4,
                   domain: "test.com"
               }
           }, 
           cma: {
               callApi: (a: string, b: string) => {
                   return {
                       source: "implied", 
                       consentDecision: [0]
                   }
               }
           }
       };
    
       const trustArcActiveGroups = getNormalizedCategories("opt-out");
    
       expect(trustArcActiveGroups).toEqual({
            "ta-1": true,
            "ta-2": true,
            "ta-3": true,
            "ta-4": true,
       });
    });

    test('when TrustArc Global is undefined', () => {
        // Mock the window.truste global variable
        window.truste = undefined;
       const trustArcActiveGroups = getNormalizedCategories("opt-out");
       expect(trustArcActiveGroups).toEqual({});
    });
    
    afterEach(() => {
        jest.resetAllMocks();
        window.truste = undefined; // Or null, depending on how you want to reset it
    });
});

