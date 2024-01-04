Save world state on unload; display banner when returning: "previous session has been restored"
Retina resolution canvas
Move replicator effects logic into effects
Slow icon
Make info into component
Allow zero radius, negative radius, other crazy values - wrap problem code in try-catch blocks
Potential decay icon = neuron with potential draining out
Value icon = dollar sign + replicator icon
If weights in local storage are incompatible (e.g., different number of think neurons), stop loading weights, don’t delete from local storage, do console error
Saving weights: don’t take average; get weights from each cryo specimen, write to local storage; on app load, look for weights in local storage, create replicators with weights and push onto cryos; cryos are ring buffers so don’t worry about capacity, add as many or few replicators as there are weights in local storage
Need ability to run simulation at half speed
Add swirling current to water
Camera reset button
Button to restore default config
Button to reset signal diffs
Rename Replic8or type to Replicator - it's confusing
If add touch sensors, probably should remove ability to reorient flippers/receptors
Restore slow-mo function (kicked from 1.5)
replicate() has mutator param
Replic8or.clone() calls replicate() with identity mutator
“Debugger” interface for inspecting simulation, changing parameters
Identify mutants with HUD
Identify mutants with color
Identify nth gen mutants with thin borders drawn just inside membrane; 3 borders turn to 2 turn to 1 turn to 0 as replicators replicate perfectly
Identify mutants with 3 exclamation points, then 2, then 1
Identify mutants with squares pushed out of slots; squares/slots reassemble with successive generations
Pixel art control bar icons (neither Font Awesome nor Unicode have every symbol we want)
Import/export config feature
Decouple neuron firing animation
Communicate flipper strength through amplitude and frequency of flip animation
Calling flip() while flipping does not completely reset animation; amplitude and frequency reset but phase is preserved
Squash and stretch replicators on collision; doBounceEffect(axis) where axis is angle of vector from a to b; effect will have beginDraw() and endDraw() methods; apply bounce transforms before spawn transforms, revert bounce transforms after spawn transforms; single replicator can have multiple bounce effects
Try horizontal line for collision effect
Responsive settings panel
YouTube video