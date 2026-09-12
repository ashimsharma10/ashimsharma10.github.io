---
title: 'World Models and the Path to Physical AI'
date: '2026-09-07'
tags: ['world-models', 'reinforcement-learning', 'robotics', 'physical-ai', 'jepa', 'model-based-rl']
draft: false
summary: 'A world model is a learned simulator: give it a state and an action and it predicts what happens next. This short write-up follows the idea from Ha and Schmidhuber''s V+M+C agent through Dreamer, MuZero, and TD-MPC, to Genie, Cosmos, and V-JEPA, the drift that comes with imagining too far ahead, LeCun''s case for predicting representations instead of pixels, and why robots need all of this.'
---

&nbsp;

## The Cognitive and Computational Imperative for World Models

A batter has a few hundred milliseconds to decide how to swing, less than the visual signal needs to reach the reasoning parts of the brain. The batter hits the ball anyway, because an internal model predicts where it will be from the first frames of its flight.

Jay Forrester, the founder of system dynamics, said the same about all of human thinking. We never process the full world. We keep a compressed model of a few concepts and run it forward.

In reinforcement learning (RL) this is a **world model**: a learned function that predicts the next state from the current state and the action. Formally it approximates the transition dynamics of a Markov Decision Process (MDP):

$$
P(s_{t+1}, r_{t+1} \mid s_t, a_t)
$$

In plain terms: given where I am and what I do, how likely is each possible next situation and reward?

The point is to plan in imagination. A model-free agent needs millions of real interactions, which is fine in a video game and unacceptable on a robot. An agent with a world model rolls out futures inside the model, compares actions it never took, and practices rare disasters safely.

<Sketch name="wm-imagined-rollout" alt="Two loops side by side: an agent acting in the real environment, which is slow and unsafe, and the same agent acting inside a world model, which is fast and safe; real transitions train the model" />

*Visual 1: The same agent can learn by acting in the world or by acting in a model of it. Real transitions are what train the model.*

The idea is older than deep learning. Schmidhuber planned in a neural world model in 1990, and Sutton's Dyna mixed real and imagined steps in 1991. What changed is scale, and the data the models can learn from.

```mermaid
flowchart TD
    A["1990 to 1991<br/>Schmidhuber's neural world model, Sutton's Dyna<br/>learn a model, plan in it"] --> B["2018<br/>World Models, Ha and Schmidhuber<br/>V + M + C, train in the dream"]
    B --> C["2019<br/>PlaNet and MuZero<br/>plan in latent space, MuZero drops the decoder"]
    C --> D["2020 to 2023<br/>DreamerV2, DreamerV3<br/>one configuration for 150 tasks"]
    D --> E["2022<br/>LeCun's JEPA proposal, TD-MPC<br/>predict representations, plan continuous actions"]
    E --> F["2024 to 2025<br/>Genie, Cosmos, V-JEPA 2<br/>world models learned from internet video"]
    classDef y fill:#e9ecef,stroke:#495057,color:#111
    class A,B,C,D,E,F y
```

## The Foundational V+M+C Architecture

The modern recipe is David Ha and Jürgen Schmidhuber's 2018 paper "World Models". They split the agent in two: a large, unsupervised world model that understands the scene, and a tiny controller that decides. The brain divides the work the same way.

<Sketch name="vmc-pipeline" alt="A vertical pipeline: a frame goes into V, which produces z; z and the action go into M, which produces h; z and h go into the linear controller C, which produces the action; the environment returns the next frame" />

*Visual 2: V sees, M remembers and predicts, C acts. Almost all the parameters live in V and M.*

- **V, the Vision model,** compresses space. A Variational Autoencoder (VAE) turns each 64×64 frame into a 32-number latent $z_t$.
- **M, the Memory model,** compresses time. A recurrent network with a mixture-density head (MDN-RNN) predicts a distribution over the next latent. A distribution, not a point, because one averaged future is a blur.
- **C, the Controller,** is one linear layer from $[z_t, h_t]$ to the action.

| Component | Architecture | Parameters | Job |
| --- | --- | --- | --- |
| V (Vision) | Variational autoencoder | 4,348,000 | Compress the frame to $z_t$ |
| M (Memory) | MDN-RNN | 422,000 | Predict $P(z_{t+1} \mid a_t, z_t, h_t)$ |
| C (Controller) | Linear layer | 867 | Choose the action $a_t$ |

C is so small that it needs no backpropagation. CMA-ES, an evolution strategy, keeps a population of weight vectors and moves toward the ones that score well. No gradient has to survive a long unroll.

## Learning in the Dream and Adversarial Exploitation

Once V and M are trained, the game is no longer needed. M predicts the next latent from its own last prediction, C picks the next action, and the loop runs inside the model: training in the dream.

```mermaid
flowchart TD
    R["collect 10,000 random rollouts<br/>from the real environment"] --> V["train V on the frames,<br/>then M on the latent sequences"]
    V --> D["evolve C with CMA-ES<br/>entirely inside M's dream"]
    D --> T["test C in the<br/>real environment"]
    T -->|"it works"| OK["done"]
    T -->|"it fails"| X["C found a gap in M<br/>and exploited it"]
    X --> F1["raise the sampling<br/>temperature τ"]
    X --> F2["collect data with the new C,<br/>retrain M, dream again"]
    F1 --> D
    F2 --> V
    classDef real fill:#a5d8ff,stroke:#1971c2,color:#111
    classDef dream fill:#d0bfff,stroke:#7048e8,color:#111
    classDef bad fill:#ffc9c9,stroke:#c92a2a,color:#111
    class R,T real
    class V,D dream
    class X bad
```

The failure branch is the interesting one. A world model is an approximation, and an optimizer finds its gaps. In VizDoom the controller found moves that stopped M from ever generating enemy fireballs. It lived forever in its dream and died at once in the real game.

Two fixes: a temperature $\tau$ makes M sample with more noise, so no loophole is reliable, and training alternates between acting for real, retraining M, and dreaming again.

## The Dreamer Lineage and Continuous Latent Dynamics

Danijar Hafner and colleagues at DeepMind turned the dream into a general agent across PlaNet, DreamerV1, DreamerV2, and DreamerV3. Every version shares one heart.

### The Recurrent State-Space Model (RSSM)

A plain recurrent network is deterministic, so it cannot hold several futures. A purely stochastic model resamples noise every step and forgets. The RSSM keeps both: a deterministic $h_t$ for memory and a stochastic $z_t$ for uncertainty.

<Sketch name="rssm" alt="A chain of deterministic states h(t-1), h(t), h(t+1) connected by a GRU; below h(t), a prior z predicted from h alone and a posterior z that also sees the image, joined by a KL loss; z and the action feed the next h" />

*Visual 3: The prior guesses $z_t$ from memory alone, the posterior also sees the image, and a KL term pulls the two together. In imagination only the prior is used.*

From DreamerV2 on, $z_t$ is discrete: 32 categorical variables with 32 classes each. They do not collapse the way Gaussian posteriors do, and they hold several futures without a mixture head. Gradients pass through the samples with a straight-through estimator.

### Robustness across Domains: Symlog and KL Balancing

Discrete latents made the model strong. The next problem was one configuration for every domain. DreamerV3 masters over 150 tasks, from continuous control to Atari to Minecraft, with a single set of hyperparameters.

The obstacle was scale: a robot task pays rewards between 0 and 1, an Atari game pays tens of thousands. DreamerV3 squashes observations, rewards, and values with one function:

$$
\operatorname{symlog}(x) = \operatorname{sign}(x)\, \ln(|x| + 1)
$$

In plain terms: small numbers pass through unchanged and huge ones get compressed like a logarithm, so every environment produces losses of about the same size. Rewards and values are predicted as a two-hot distribution over bins, not as a raw scalar.

The other trick is in the KL terms that tie the prior to the posterior. Matched too tightly, the model learns empty latents. **Free bits** clip each KL below 1 nat, so once the two are close the pressure stops. **KL balancing** makes the prior do most of the moving. The actor and critic train on imagined rollouts, and their gradients never touch the world model.

| DreamerV3 on Minecraft | |
| --- | --- |
| Task | Collect a diamond from scratch, no demonstrations or curriculum |
| Environment steps | First diamond after about 29 million in the 2023 preprint; every agent finds one within 100 million in the 2025 Nature version |
| Compute | About 17 GPU-days in the preprint; one GPU for 9 days in the Nature version |
| Scaling | Larger models are both more data-efficient and better at convergence |

No algorithm had mined a diamond without human data before. It takes thousands of correct steps for one sparse reward.

## Value Equivalence and the MuZero Paradigm

Dreamer grounds its latent space by reconstructing observations. A parallel line of work asks whether that is needed at all. The **Value Equivalence Principle** says no: an agent only has to predict what planning uses.

Two models are value equivalent if they give the same Bellman updates for the policies and value functions you care about. If an imagined transition yields the same reward and future value as the real one, the models are interchangeable, however different their states look.

<Sketch name="muzero" alt="Past frames go through the representation function h into hidden state s0; the dynamics function g takes s0 and an action to s1 and a reward, then to s2; the prediction function f maps each state to a policy and a value; a note says there is no decoder" />

*Visual 4: MuZero's three functions. Search unrolls $g$ from $s_0$, and the loss only cares about rewards, values, and policies.*

MuZero is that principle as a system. **Representation $h$** maps recent frames to a hidden state. **Dynamics $g$** maps a state and an action to the next state and a reward. **Prediction $f$** maps a state to a policy and a value. Monte Carlo Tree Search unrolls $g$ and uses the value at the leaves instead of playing games to the end. Nothing asks the hidden state to look like the screen. The result matched AlphaZero in Chess, Go, and Shogi and set a record on Atari.

## Implicit World Models and TD-MPC for Continuous Control

Tree search enumerates discrete moves, which fails for a robot that outputs joint torques. **TD-MPC** and TD-MPC2 keep the decoder-free model and swap the tree for Model Predictive Path Integral (MPPI) planning in latent space.

```mermaid
flowchart TD
    S["sample many action sequences<br/>from a Gaussian, seeded by the policy"] --> R["roll each one out<br/>inside the latent model"]
    R --> V["score it: predicted rewards<br/>plus the value function at the horizon"]
    V --> U["move the Gaussian toward<br/>the best sequences"]
    U -->|"a few iterations"| S
    U --> E["execute only the first action,<br/>then replan next step"]
    E --> S
    classDef plan fill:#d0bfff,stroke:#7048e8,color:#111
    classDef real fill:#a5d8ff,stroke:#1971c2,color:#111
    class S,R,V,U plan
    class E real
```

### Mitigating Policy Mismatch and Scaling the Architecture

TD-MPC2 showed the implicit model scales. One 317-million-parameter agent learned 80 tasks across the DeepMind Control suite and Meta-World, with different robots and no per-task tuning. Actions are zero-padded to the largest size and the unused entries masked.

Scaling exposed a crack. The value function is trained under the policy network, but the data comes from the planner, which behaves differently. Asked about states the policy would never visit, the value network overestimates, badly on a 61-degree-of-freedom humanoid. The fix keeps the two close: regularize the policy toward the planner, and seed the planner from the policy.

| Paradigm | Algorithm | Planning | Reconstructs pixels | Home domain |
| --- | --- | --- | --- | --- |
| Generative latent dynamics | DreamerV3 | Actor-critic on imagined rollouts | Yes, regularized | Games and control |
| Value-equivalent search | MuZero | Monte Carlo Tree Search | No | Board games, Atari |
| Implicit predictive control | TD-MPC2 | MPPI in latent space | No | Robotics, locomotion |

## Generative Video, Foundation World Models, and Action Conditioning

Everything so far learned one environment at a time. As transformers scaled to internet video, the question became whether one model could learn many worlds at once. DeepMind's **Genie** and NVIDIA's **Cosmos** are the first answers: foundation world models.

A video model is not automatically a world model. Sora was pitched as a "world simulator", but it is passive: nothing can step in and change what happens next. A world model must be **action-conditioned**. An action at time $t$ must causally change the state at $t+1$, or the model cannot serve as a simulator.

### Genie: Unsupervised Latent Action Discovery

Genie is an 11-billion-parameter world model trained only on unlabelled videos of 2D platformers. Nobody recorded which buttons the players pressed, so the actions have to be discovered. The team filtered 55 million clips down to 6.8 million (about 30,000 hours) and trained three parts.

<Sketch name="genie" alt="Training: video frames go through a tokenizer, frame pairs go through a latent action model that infers one of 8 actions, and both feed a MaskGIT dynamics model that predicts the next tokens. Playing: an image prompt and a chosen action go into the dynamics model, which produces the next frame, and the loop repeats" />

*Visual 5: Genie learns actions from video alone. At play time the latent action model is gone and the user supplies the action.*

- **Video tokenizer.** A VQ-VAE with spatial and temporal attention turns frames into discrete tokens.
- **Latent Action Model (LAM).** Looks at two consecutive frames and infers the action that caused the change. Its codebook has only 8 entries, so the actions have to mean things like jump and move right.
- **Dynamics model.** A MaskGIT transformer predicts the next frame's tokens from past tokens and the action.

At play time the LAM is discarded. Give Genie a photo or a sketch, press a number from 0 to 7, and it generates the next frame. Genie 2 then generated 3D worlds from one image, and Genie 3 runs them in real time for minutes.

Cosmos takes the idea to physical scenes: open-weight tokenizers and world models meant to be post-trained for robots and cars. Wayve's GAIA models do the same for driving, and 1X trains one for its humanoid.

### Architectural Mechanisms of Action Conditioning

Whatever the backbone, the action has to get inside the network.

| Mechanism | How the action enters | Strength | Weakness |
| --- | --- | --- | --- |
| Adaptive LayerNorm (AdaLN-Zero) | The action embedding produces the scale and shift of each normalization layer | Lower FID and cheaper than cross-attention in DiT | Modulates whole features, not positions |
| Cross-attention | State tokens query the action embeddings | High capacity for complex alignment | Per-robot action labels can split the action space across embodiments |
| FiLM | An affine transform of the feature maps, computed from the action | Simple, amplifies or suppresses spatial features | Less expressive than attention |

## Failure Modes: Hallucination and Horizon Drift

Every model above shares one weakness. To imagine step $t+2$ it feeds its own prediction for $t+1$ back in as input. A small error becomes the ground truth for the next step, and errors compound. After enough steps the trajectory leaves the data the model was trained on and the physics becomes impossible.

<Sketch name="horizon-drift" alt="Five boxes from green to red: a tiny error at step 1 grows through steps 2 and 3, becomes a hallucination at step 4, and an impossible state at step 5; below, three fixes: a short horizon with a critic, scheduled sampling, and a Dyna-style loop with real data" />

*Visual 6: Compounding rollout error. The policy trains against those red states and then fails in reality.*

LeCun uses the same arithmetic against autoregressive language models. If each step has a small chance $e$ of going wrong, the chance of still being on track after $n$ steps is $(1-e)^n$, which falls off exponentially.

```mermaid
xychart-beta
    title "Chance a rollout is still on track after n steps"
    x-axis "steps" [1, 5, 10, 20, 50, 100]
    y-axis "probability" 0 --> 1
    line "1% error per step" [0.99, 0.95, 0.90, 0.82, 0.61, 0.37]
    line "5% error per step" [0.95, 0.77, 0.60, 0.36, 0.08, 0.01]
```

The problem is structural, so the fixes limit the damage rather than remove it.

| Mitigation | What it does |
| --- | --- |
| Short imagination horizons | Dreamer imagines about 15 steps and lets the critic's value cover the rest |
| Scheduled sampling and noise | Train the model on its own past predictions part of the time, and add input noise, so it learns to recover from its mistakes |
| KL regularization | Stops the dynamics model from committing to confident, specific, wrong long-term predictions |
| Dyna-style interleaving | Keep acting for real and retraining, and use ensembles to know when the model is unsure |

## Yann LeCun's Vision and the JEPA Paradigm

Compounding error is worst when the model has to predict every pixel. That is the center of Yann LeCun's 2022 position paper, "A Path Towards Autonomous Machine Intelligence", and of his argument since. His position, in his own terms:

- **Generating the world pixel by pixel is "doomed to fail."** The world is uncertain. A generator forced to predict every detail averages its futures into a blur and never learns concepts an agent can act on.
- **Self-supervised learning is the cake, RL is the cherry.** Most of what an animal knows comes from watching, not reward. RL should only fine-tune a model that already understands the world.
- **A cat knows more physics than any language model.** Text is a thin description of the world. Human-level AI has to learn from video and interaction, the way infants learn object permanence and gravity.
- **Objective-driven AI.** Instead of predicting the next token, search for the actions whose imagined outcome has the lowest cost. The world model is the part that matters; the actor is an optimizer.

<Sketch name="lecun-modules" alt="LeCun's six modules: a configurator on top sets the goal; perception feeds a JEPA world model, which feeds a cost module; the actor proposes a plan to the world model and receives the gradient of the cost; short-term memory feeds the world model; a note says acting is optimization" />

*Visual 7: LeCun's blueprint. The actor proposes a plan, the world model imagines the outcome, the cost scores it, and the plan is adjusted until the imagined cost is low.*

The world model in that blueprint is a **Joint Embedding Predictive Architecture (JEPA)**. It predicts the *representation* of the future frame, not the frame. V-JEPA, the video version, uses three networks and no decoder.

<Sketch name="vjepa" alt="A video clip with hidden patches: the visible part goes through a context encoder and a predictor to a predicted embedding; the hidden part goes through a slow-moving target encoder to a target embedding; the loss is the L1 distance between the two" />

*Visual 8: V-JEPA predicts embeddings, not pixels. The loss is a distance in representation space.*

- **Context encoder.** A Vision Transformer embeds the visible frames. It is a filter: noise, textures, and backgrounds are dropped, and capacity goes to object permanence and collisions.
- **Target encoder.** A slow-moving copy of the context encoder embeds the hidden part in the same space.
- **Predictor.** Maps the context embedding to the target embedding, with a latent $z$ for whatever the context could not see.

$$
\mathcal{L} = \left\| \text{Pred}\big(E(x_{\text{ctx}}),\, z\big) - E_{\text{tgt}}(x_{\text{tgt}}) \right\|_1
$$

In plain terms: the loss is how far the predicted embedding is from the target embedding. No adversarial game, no pixel decoder, no negative samples. The one danger is collapse, where both encoders output a constant, and variance-covariance regularization prevents it.

V-JEPA 2 scaled the recipe to a billion-parameter encoder and a million hours of video. Its robot variant, V-JEPA 2-AC, adds an action-conditioned predictor trained on under 62 hours of robot data, plans in latent space, and picked and placed objects zero-shot on arms in labs it had never seen. VL-JEPA brings the same idea to language with about half the trainable parameters of a token-space model.

## World Models as Simulators for Physical AI

Latent planning matters most where real data is scarce: robots. Every real trial is slow, wears hardware, and can break things. Physics engines help, but a policy trained in one meets a sim-to-real gap the moment it touches a real cup. A world model learned from real video sits closer to reality, and it fills three roles.

```mermaid
flowchart TD
    D["internet video + robot logs"] --> W["foundation world model<br/>(Cosmos, V-JEPA 2, Genie-style)"]
    W --> S["a simulator: fine-tune the<br/>policy with RL inside the model"]
    W --> P["a planner: MPC in<br/>latent space, at run time"]
    W --> C["a verifier: did the imagined<br/>outcome reach the goal?"]
    S --> V["VLA policy<br/>(vision, language, action)"]
    P --> V
    C --> V
    V --> R["the real robot"]
    R -->|"new trajectories"| D
    classDef data fill:#e9ecef,stroke:#495057,color:#111
    classDef model fill:#d0bfff,stroke:#7048e8,color:#111
    classDef use fill:#c3fae8,stroke:#0ca678,color:#111
    class D,R data
    class W,V model
    class S,P,C use
```

- **As a simulator.** A vision-language-action (VLA) policy is fine-tuned with RL inside the world model, then transferred. The horizon-drift lesson applies in full: short rollouts and fresh real data.
- **As a planner.** V-JEPA 2-AC never trains a policy. It scores candidate action sequences in latent space at every step.
- **As a verifier.** A model that predicts outcomes can check them. That is the move the [RLVR write-up](/write-up/rlvr-and-the-experience-era) describes for language models. For a robot, the world model is the closest thing to a unit test.

That is where the two eras of RL meet. Language models learned to trust checkable outcomes over human opinion. Physical AI needs the same shift, and a world model makes an outcome checkable before the robot moves.

## What We Learned

- **A world model is a learned transition function.** State and action in, next state and reward out, so the agent can plan and train in imagination.
- **Split perception from decision.** V+M+C put millions of parameters in the model and 867 in the controller.
- **Dreams get exploited.** An optimizer finds the model's gaps. Temperature and fresh real data close them.
- **Memory and uncertainty need separate states.** The RSSM's deterministic $h$ remembers; its categorical $z$ holds several futures. Symlog and free bits let one configuration master 150 tasks.
- **You do not have to reconstruct pixels.** Value equivalence says rewards, values, and policies are enough. MuZero plans with search; TD-MPC2 with MPPI.
- **Action conditioning makes a video model a world model.** Genie discovers 8 latent actions from unlabelled video.
- **Errors compound over the horizon.** Short rollouts, scheduled sampling, and real-data interleaving keep the drift in check.
- **LeCun's bet: predict representations, not frames.** JEPA learns from video without reward and plans by minimizing an imagined cost.
- **For robots, the world model is simulator, planner, and verifier.** That is how the verifiable-reward idea reaches Physical AI.

## Sources and further reading

- [World Models](https://arxiv.org/abs/1803.10122) by Ha and Schmidhuber and its [interactive site](https://worldmodels.github.io/); Schmidhuber's [1990 report](https://people.idsia.ch/~juergen/FKI-126-90ocr.pdf) and Sutton's [Dyna](https://dl.acm.org/doi/10.1145/122344.122377)
- [PlaNet](https://arxiv.org/abs/1811.04551), [DreamerV1](https://arxiv.org/abs/1912.01603), [DreamerV2](https://arxiv.org/abs/2010.02193), and [DreamerV3](https://arxiv.org/abs/2301.04104)
- [MuZero](https://arxiv.org/abs/1911.08265), [The Value Equivalence Principle](https://arxiv.org/abs/2011.03506), and [Proper Value Equivalence](https://arxiv.org/abs/2106.10316)
- [TD-MPC](https://arxiv.org/abs/2203.04955), [TD-MPC2](https://arxiv.org/abs/2310.16828), and [TD-M(PC)²](https://arxiv.org/abs/2502.03550) on policy mismatch
- [Genie](https://arxiv.org/abs/2402.15391), [Genie 2](https://deepmind.google/discover/blog/genie-2-a-large-scale-foundation-world-model/), [Genie 3](https://deepmind.google/discover/blog/genie-3-a-new-frontier-for-world-models/), [Cosmos](https://arxiv.org/abs/2501.03575), and [GAIA-1](https://arxiv.org/abs/2309.17080)
- [DiT](https://arxiv.org/abs/2212.09748) (AdaLN-Zero versus cross-attention), [FiLM](https://arxiv.org/abs/1709.07871), and [Scheduled Sampling](https://arxiv.org/abs/1506.03099)
- [A Path Towards Autonomous Machine Intelligence](https://openreview.net/forum?id=BZ5a1r-kVsf) by LeCun, [V-JEPA](https://arxiv.org/abs/2404.08471), [V-JEPA 2](https://arxiv.org/abs/2506.09985), and [VL-JEPA](https://arxiv.org/abs/2512.10942)
