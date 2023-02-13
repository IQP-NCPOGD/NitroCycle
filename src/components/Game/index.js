import React, { useState, useCallback, useEffect, useRef } from "react"
import ARComponent from "../ARComponent"
import GUIComponent from "../GUIComponent"
import MenuHandler from "../Menu"

import './styles.css'

export const ModelContext = React.createContext();
export const GameStateContext = React.createContext();

export const plantsPerPlot = 16;
export const costPerPlant = 25;
export const costPerAmmonium = 100;

export const foodSilosPerPlot = 4;
export const costPerFoodSilo = 50;

export const ammoniumSilosPerPlot = 3;
export const costPerAmmoniumSilo = 75;

export const fixatorsPerPlot = 2;
export const costPerFixator = 100;

const defaultFoodStorage = 200;
const defaultAmmoniumStorage = 10;

const msToDisplayMenu = 2000;

const msToPlant = 10000;
const msToWilt = 5000;
const msToRemoval = 5000;

const msToMaintainAmmoniumSilo = 5000;
const msToExplode = 10000;

export const plantTypeEnum = {
    wilt: {
        name: "Wilt",
        imgURL: "/data/images/wilt.png",
        foodproduction: 2,
        upgradeCost: 6,
    },
    sprout: {
        name: "Sprout",
        imgURL: "/data/images/sprout.png",
        foodproduction: 5,
    },
    plant: {
        name: "Plant",
        imgURL: "/data/images/plant.png",
        foodproduction: 10,
        upgradeCost: 2,
    },
    bloom: {
        name: "Bloom",
        imgURL: "/data/images/bloom.png",
        foodproduction: 15,
    },
}

export const foodSiloTypeEnum = {
    1: {
        level: 1,
        name: "Silo (Lvl 1)",
        imgURL: "/data/images/silo.png",
        foodstorage: 200,
        upgradeCost: 30,
    },
    2: {
        level: 2,
        name: "Silo (Lvl 2)",
        imgURL: "/data/images/silo.png",
        foodstorage: 400,
        upgradeCost: 30,
    },
    3: {
        level: 3,
        name: "Silo (Lvl 3)",
        imgURL: "/data/images/silo.png",
        foodstorage: 600,
        upgradeCost: 30,
    },
    4: {
        level: 4,
        name: "Silo (Lvl 4)",
        imgURL: "/data/images/silo.png",
        foodstorage: 800,
        upgradeCost: 30,
    },
    5: {
        level: 5,
        name: "Silo (Lvl 5)",
        imgURL: "/data/images/silo.png",
        foodstorage: 1000,
        upgradeCost: 30,
    },
}

export const ammoniumSiloTypeEnum = {
    safe: {
        name: "Ammonium Silo",
        imgURL: "/data/images/ammonium.png",
        ammoniumstorage: 10,
    },
    risk: {
        name: "Ammonium Silo (NEEDS MAINTENANCE)",
        imgURL: "/data/images/ammonium.png",
        ammoniumstorage: 10,
        maintenanceCost: 50,
    }
}

export const fixatorTypeEnum = {
    normal: {
        name: "Nitrogen Fixator",
        imgURL: "/data/images/denitrifier.png",
        ammoniumproduction: 1,
    }
}

let currentPlantId = 0;
export const createPlant = (setPlantState) => {
    let createdPlant = {
        id: currentPlantId,
        timeoutID: null,
        state: plantTypeEnum.sprout,
    }

    createdPlant.timeoutID = setTimeout(() => setPlantState((oldest) => {
        let id = createdPlant.id;
        createdPlant.state = plantTypeEnum.plant;

        createdPlant.timeoutID = setTimeout(() => setPlantState((older) => {
            let id = createdPlant.id;
            createdPlant.state = plantTypeEnum.wilt

            createdPlant.timeoutID = setTimeout(() => setPlantState((old) => {
                let id = createdPlant.id;
                let { [id]: removedID, ...nextState } = old;
                return nextState;
            }), msToRemoval);

            return { ...older, [id]: Object.create(createdPlant) }
        }), msToWilt);

        return { ...oldest, [id]: Object.create(createdPlant) }
    }), msToPlant);

    setPlantState((old) => {
        let id = createdPlant.id;
        return { ...old, [id]: Object.create(createdPlant) }
    });

    currentPlantId++;
}

export const fertilizePlant = (plantID, setPlantState) => {
    setPlantState((old) => {
        let oldPlant = old[plantID];
        clearTimeout(oldPlant.timeoutID);
        oldPlant.state = plantTypeEnum.bloom;
        return { ...old, [plantID]: oldPlant }
    })
}

let currentFoodSiloId = 0;
export const createFoodSilo = (setFoodSiloState) => {
    let createdFoodSilo = {
        id: currentFoodSiloId,
        timeoutID: null,
        state: foodSiloTypeEnum[1],
    }

    setFoodSiloState((old) => {
        let id = createdFoodSilo.id;
        return { ...old, [id]: Object.create(createdFoodSilo) }
    });

    currentFoodSiloId++;
}

export const upgradeFoodSilo = (foodSiloID, setFoodSiloState) => {
    setFoodSiloState((old) => {
        let oldSilo = old[foodSiloID];
        clearTimeout(oldSilo.timeoutID);
        oldSilo.state = oldSilo.state.level === 5 ? foodSiloTypeEnum[5] : foodSiloTypeEnum[oldSilo.state.level + 1];
        return { ...old, [foodSiloID]: oldSilo }
    })
}

let currentAmmoniumSiloId = 0;
export const createAmmoniumSilo = (setAmmoniumSiloState) => {
    let createdAmmoniumSilo = {
        id: currentAmmoniumSiloId,
        timeoutID: null,
        state: ammoniumSiloTypeEnum.safe,
    }

    createdAmmoniumSilo.timeoutID = setTimeout(() => setAmmoniumSiloState((older) => {
        let id = createdAmmoniumSilo.id;
        createdAmmoniumSilo.state = ammoniumSiloTypeEnum.risk;

        createdAmmoniumSilo.timeoutID = setTimeout(() => setAmmoniumSiloState((old) => {
            let id = createdAmmoniumSilo.id;
            let { [id]: removedID, ...nextState } = old;
            return nextState;
        }), msToExplode);
        
        return {...older, [id]: Object.create(createdAmmoniumSilo)}

    }), msToMaintainAmmoniumSilo);

    setAmmoniumSiloState((oldest) => {
        let id = createdAmmoniumSilo.id;
        return { ...oldest, [id]: Object.create(createdAmmoniumSilo) }
    })

    currentAmmoniumSiloId++;
}

export const maintainAmmoniumSilo = (ammoniumSiloID, setAmmoniumSiloState) => {
    setAmmoniumSiloState((oldest) => {
        let oldSilo = oldest[ammoniumSiloID];
        clearTimeout(oldSilo.timeoutID);
        oldSilo.state = ammoniumSiloTypeEnum.safe;

        oldSilo.timeoutID = setTimeout(() => setAmmoniumSiloState((older) => {
            let id = oldSilo.id;
            oldSilo.state = ammoniumSiloTypeEnum.risk;
    
            oldSilo.timeoutID = setTimeout(() => setAmmoniumSiloState((old) => {
                let id = oldSilo.id;
                let { [id]: removedID, ...nextState } = old;
                return nextState;
            }), msToExplode);
            
            return {...older, [id]: Object.create(oldSilo)}
    
        }), msToMaintainAmmoniumSilo);

        return { ...oldest, [ammoniumSiloID]: oldSilo }
    })
}

let currentFixatorId = 0;
export const createFixator = (setFixatorState) => {
    let createdFixator = {
        id: currentFixatorId,
        timeoutID: null,
        state: fixatorTypeEnum.normal,
    }

    setFixatorState((old) => {
        let id = createdFixator.id;
        return {...old, [id]: Object.create(createdFixator)}
    })

    currentFixatorId++;
}

export const calculateFoodPerMinute = (plantState) => {
    return Object.values(plantState).reduce((accumulator, plant) => accumulator + plant.state.foodproduction, 0)
}

export const calculateFoodStorage = (foodSiloState) => {
    return Object.values(foodSiloState).reduce((accumulator, foodSilo) => accumulator + foodSilo.state.foodstorage, 0)
}

export const calculateAmmoniumStorage = (ammoniumSiloState) => {
    return Object.values(ammoniumSiloState).reduce((accumulator, ammoniumSilo) => accumulator + ammoniumSilo.state.ammoniumstorage, 0);
}

export const calculateAmmoniumPerMinute = (fixatorState) => {
    return Object.values(fixatorState).reduce((accumulator, fixator) => accumulator + fixator.state.ammoniumproduction, 0);
}

const generateValidator = (currentRef, maxRef, setState) => {
    return (cb) => {
        let nextVal = cb(currentRef.current);
        if (nextVal > maxRef.current) {
            setState((old) => maxRef.current);
            return false;
        } else if (nextVal < 0) {
            return false;
        } else {
            setState(cb);
            return true;
        }
    }
}

export function Game(props) {

    // ---------- STATE ----------

    // Game Data

    const [foodSecurityLevel, setFoodSecurityLevel] = useState(0);

    const [food, setFood] = useState(200);
    const [maxFood, setMaxFood] = useState(defaultFoodStorage);
    const [ammonium, setAmmonium] = useState(0);
    const [maxAmmonium, setMaxAmmonium] = useState(defaultAmmoniumStorage);
    const [nitrogenRunoff, setNitrogenRunoff] = useState(0);
    const [maxNitrogenRunoff, setMaxNitrogenRunoff] = useState(5);

    const [plantState, setPlantState] = useState({});
    const [foodSiloState, setFoodSiloState] = useState({});
    const [ammoniumSiloState, setAmmoniumSiloState] = useState({});
    const [fixatorState, setFixatorState] = useState({});

    // Refs

    const foodRef = useRef(food); foodRef.current = food;
    const maxFoodRef = useRef(maxFood); maxFoodRef.current = maxFood;

    const ammoniumRef = useRef(ammonium); ammoniumRef.current = ammonium;
    const maxAmmoniumRef = useRef(maxAmmonium); maxAmmoniumRef.current = maxAmmonium;

    const foodRateRef = useRef(0);
    const ammoniumRateRef = useRef(0);

    // Validators

    const setFoodValidated = generateValidator(foodRef, maxFoodRef, setFood);
    const setAmmoniumValidated = generateValidator(ammoniumRef, maxAmmoniumRef, setAmmonium);

    // Tile Visibility

    const [plantVisible, setPlantVisible] = useState(true);
    const [foodSiloVisible, setFoodSiloVisible] = useState(true);
    const [ammoniumSiloVisible, setAmmoniumSiloVisible] = useState(true);
    const [fixatorVisible, setFixatorVisible] = useState(true);

    useEffect(() => {
        /*
        Currently only solution I know to fix rendering on state changes
        This is because state change causes a re-render of the component

        Dispatching the resize event fixes the canvas rendering,
        so it should be called after any state changes
        */
        window.dispatchEvent(new Event('resize'));
    }, [food, ammonium, plantVisible, plantState, foodSiloVisible, foodSiloState, ammoniumSiloVisible, ammoniumSiloState, fixatorVisible, fixatorState])

    // ---------- GAME LOGIC ----------

    // add food and ammonium every second
    useEffect(() => {
        setInterval(() => {
            setFoodValidated((old) => old + foodRateRef.current)
            setAmmoniumValidated((old) => old + ammoniumRateRef.current)
        }, 1000);
    }, []);

    // update food production when plants change
    useEffect(() => {
        foodRateRef.current = calculateFoodPerMinute(plantState);
    }, [plantState])

    // update ammonium production when fixators change
    useEffect(() => {
        ammoniumRateRef.current = calculateAmmoniumPerMinute(fixatorState);
    }, [fixatorState])

    // update max food storage when food silos change
    useEffect(() => {
        setMaxFood(defaultFoodStorage + calculateFoodStorage(foodSiloState));
    }, [foodSiloState])

    // update max ammonium storage when ammonium silos change
    useEffect(() => {
        setMaxAmmonium(defaultAmmoniumStorage + calculateAmmoniumStorage(ammoniumSiloState));
    }, [ammoniumSiloState])

    // ---------- CALLBACKS ----------

    const generateMarkerCallbacks = (timeoutID, setVisibleState) => {
        return [
            useCallback(() => {
                clearTimeout(timeoutID);
                setVisibleState(true);
            }, []),
            useCallback(() => {
                window.dispatchEvent(new Event('resize'));
                clearTimeout(timeoutID);
                timeoutID = setTimeout(() => setVisibleState(false), msToDisplayMenu);
            }, [])
        ];
    }

    let plantVisibleTimeout = null;
    let foodSiloVisibleTimeout = null;
    let ammoniumSiloVisibleTimeout = null;
    let fixatorVisibleTimeout = null;

    const [plantFound, plantLost] = generateMarkerCallbacks(plantVisibleTimeout, setPlantVisible);
    const [foodSiloFound, foodSiloLost] = generateMarkerCallbacks(foodSiloVisibleTimeout, setFoodSiloVisible);
    const [ammoniumSiloFound, ammoniumSiloLost] = generateMarkerCallbacks(ammoniumSiloVisibleTimeout, setAmmoniumSiloVisible);
    const [fixatorFound, fixatorLost] = generateMarkerCallbacks(fixatorVisibleTimeout, setFixatorVisible);

    // ---------- PROPS ----------

    const currentState = {
        foodSecurityLevel, setFoodSecurityLevel,
        food, setFoodValidated,
        maxFood, setMaxFood,
        ammonium, setAmmoniumValidated,
        maxAmmonium, setMaxAmmonium,
        nitrogenRunoff, setNitrogenRunoff,
        maxNitrogenRunoff, setMaxNitrogenRunoff,
        plantState, setPlantState,
        foodSiloState, setFoodSiloState,
        ammoniumSiloState, setAmmoniumSiloState,
        fixatorState, setFixatorState,
        plantVisible, setPlantVisible,
        foodSiloVisible, setFoodSiloVisible,
        ammoniumSiloVisible, setAmmoniumSiloVisible,
        fixatorVisible, setFixatorVisible,
    }

    const ARprops = {
        plantFound, plantLost,
        foodSiloFound, foodSiloLost,
        ammoniumSiloFound, ammoniumSiloLost,
        fixatorFound, fixatorLost,
    }

    const GUIprops = {
        ...currentState
    }


    // ---------- RENDER ----------

    return (
        <>
            <ModelContext.Provider value={{ plantState, foodSiloState, ammoniumSiloState, fixatorState }}>
                <ARComponent {...ARprops} />
            </ModelContext.Provider>

            <GUIComponent
                {...GUIprops}
            />

            <GameStateContext.Provider value={{ ...currentState }}>
                <MenuHandler />
            </GameStateContext.Provider>


        </>
    );
}
