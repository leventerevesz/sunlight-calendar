let PLOT_SIZE = 310;
let PLOT_CENTER_X = 200;
let PLOT_CENTER_Y = 275;

function timeOfDay(time, midnight) {
    let tod = (time - midnight) / (24 * 60 * 60 * 1000)
    
    if (tod < 0)
        return 0;
    
    if (tod > 1)
        return 1;
        
    return tod;
}

function calculateTimes(latitude, longitude, altitude, tz_offset)
{
    let times = {};
    times.sunrise = [];
    times.sunset = [];
    times.dawn = [];
    times.dusk = [];
    times.morning_sunset = [];
    times.morning_dusk = [];
    
    for (let d = 1; d <= 365; d++) {
        let day = new Date(Date.UTC(2022, 0, d, - tz_offset));
        let noon = new Date(Date.UTC(2022, 0, d, 12 - tz_offset));
        let t = SunCalc.getTimes(noon, latitude, longitude, altitude);
        
        let solarNoon = timeOfDay(t.solarNoon, day);
        let sunrise = timeOfDay(t.sunrise, day);
        let sunset = timeOfDay(t.sunset, day);
        let dawn = timeOfDay(t.dawn, day);
        let dusk = timeOfDay(t.dusk, day);
        
        // In the arctic sometimes the last sunset is part of today
        let prev_noon = new Date(Date.UTC(2022, 0, d-1, 12 - tz_offset));
        let t_prev_day = SunCalc.getTimes(prev_noon, latitude, longitude, altitude);
        let morning_sunset = timeOfDay(t_prev_day.sunset, day);
        let morning_dusk = timeOfDay(t_prev_day.dusk, day);
        
        // In the arctic sometimes the sun does not rise and/or set.
        let isLocalWinter = (latitude < 0) ^ (d < 91 || d > 274);
        
        if (isNaN(sunrise) && isNaN(sunset) && isLocalWinter) {
            sunrise = solarNoon;
            sunset = solarNoon;
        }
        
        if (isNaN(sunrise))
            sunrise = 0;
        
        if (isNaN(sunset))
            sunset = 1;

        if (isNaN(dawn) && isNaN(dusk) && isLocalWinter) {
            dawn = solarNoon;
            dusk = solarNoon;
        }
        
        if (isNaN(dawn))
            dawn = 0;
            
        if (isNaN(dusk))
            dusk = 1;
        
        times.sunrise.push(sunrise);
        times.sunset.push(sunset);
        times.dawn.push(dawn);
        times.dusk.push(dusk);

        if (!isNaN(morning_sunset))
            times.morning_sunset.push(morning_sunset);
        
        if (!isNaN(morning_dusk))
            times.morning_dusk.push(morning_dusk);
    }
    
    return times;
}

function createCurve(times, reversed=false)
{
    let points = [];
    
    for (let i in times) {
        // Polar coordinates
        let angle = i / times.length * 2 * Math.PI;
        let r = times[i] * PLOT_SIZE / 2;
        
        // Cartesian coordinates
        let x = r * Math.sin(angle) + PLOT_CENTER_X;
        let y = -r * Math.cos(angle) + PLOT_CENTER_Y;
        
        points.push(new Point(x, y));
    }
    
    if (reversed) {
        points.reverse();
    }
    
    let smooth_factor = 0.1;

    return new Bezier(points, smooth_factor);
}

function createSvgShape(morningTimes, eveningTimes, overflowEveningTimes)
{
    let shape = "";
    shape += createCurve(eveningTimes).svg();
    
    // The inner curve has reversed winding order, so it
    // creates a hole in the shape
    shape += createCurve(morningTimes, true).svg();

    // Overflow sunset/dusk times are added as a convex shape
    // in the center
    shape += createCurve(overflowEveningTimes).svg();
    
    return shape;
}

function createShapes(latitude, longitude, altitude, tz_offset)
{
    let times = calculateTimes(latitude, longitude, altitude, tz_offset);

    let shapes = {};
    shapes.sunlight = createSvgShape(times.sunrise,
                                     times.sunset,
                                     times.morning_sunset);
    shapes.twilight = createSvgShape(times.dawn,
                                     times.dusk,
                                     times.morning_dusk);
    
    return shapes;
}
