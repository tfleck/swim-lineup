# Swim-Lineup

This is a program to generate the best lineup for a swim meet, without knowing anything about the opposing team.

I have implemented an algorithm originally developed by Alan Fleck as an Excel macro, in JavaScript for use in a web browser.

It can crunch through the 8 events in the test.csv file in just a few seconds.

You can view a live version here:<br>
<https://tfleck.github.io/swim-lineup/>

----

## How It Works

Swimmers are compared based on a metric called RPI (Relative Power Index), this is detemined by this equation:<br>
`RPI = Swimmer's Time/Record Time`.

Once RPI is calculated for all swimmers' events, we are looking for the lineup with the lowest total RPI, calculated by just summing all RPI's in the lineup.

We have a way to compare lineups to determine which is better, now we just need to test all possible lineups.

To limit the computational power required, this method focuses on the events, rather than the swimmers themselves. In a swim meet, only the top 3 swimmers matter for points, and there is a limit of 2 events per swimmer (for high school swimming).

We can cover not all, but most reasonable, possible orders of lineups by assigning the top 3 swimmers to an event, and cycling through all possible permutations of the order of events.

This program uses a recursive algorithm to generate all of the permuations for orders of events:
```
P(1,2,3) = [1 + P(2,3)] + [2 + P(1,3)] + [3 + P(1,2)]
P(1,2)   = [1 + P(2)] + [2 + P(1)]
P(1)     = [1]
```

Finally, just keep track of the lineup with the lowest total RPI while cycling to find the best one. That is then rendered out as a table for the user.

---

## Future Improvements

Add support for multiple times per swimmer (best,worst,most likely) and use a triangle distribution to predict a swimmer's time for each event.

Add a "time penalty" for swimmers swimming back to back events to account for tiredness.

Change how the program loops to include different 2nd and 3rd place swimmers instead of picking the top 3 for every event, this would cover more edge cases.

Add in support for relay events.

Add support for different sets of rules (e.g. the limit on the number of events a swimmer can be in).

----

*If you implement any of these improvements, please submit a pull request!*