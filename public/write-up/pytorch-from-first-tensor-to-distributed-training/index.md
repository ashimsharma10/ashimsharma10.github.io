---
title: 'PyTorch: From First Tensor to Distributed Training'
date: '2026-06-07'
tags: ['pytorch', 'deep-learning', 'distributed-training', 'guide']
draft: false
summary: 'Deep guide for ML engineers: tensors, autograd, nn.Module, training loops, DDP, FSDP, checkpointing, and debugging at scale.'
---

### A Deep Guide for ML Infrastructure Engineers

&nbsp;

**Table of Contents**

1. [What PyTorch Actually Is (and Isn't)](#1-what-pytorch-actually-is)
2. [Tensors: The Mental Model](#2-tensors-the-mental-model)
3. [Tensor Memory: Storage, Strides, Contiguity](#3-tensor-memory-storage-strides-contiguity)
4. [Tensor Operations & Syntax Reference](#4-tensor-operations--syntax-reference)
5. [Autograd: How Gradients Actually Flow](#5-autograd-how-gradients-actually-flow)
6. [nn.Module: Anatomy of a Model](#6-nnmodule-anatomy-of-a-model)
7. [The Training Loop: Every Moving Part](#7-the-training-loop-every-moving-part)
8. [Optimizers & Learning Rate Schedules](#8-optimizers--learning-rate-schedules)
9. [Data Loading Pipeline](#9-data-loading-pipeline)
10. [Saving & Loading: state_dict Mechanics](#10-saving--loading-state_dict-mechanics)
11. [GPU Programming: Device Management](#11-gpu-programming-device-management)
12. [Mixed Precision Training (AMP)](#12-mixed-precision-training)
13. [Distributed Training: DDP From Scratch](#13-distributed-training-ddp-from-scratch)
14. [FSDP: When Models Don't Fit](#14-fsdp-when-models-dont-fit)
15. [Distributed Checkpointing](#15-distributed-checkpointing)
16. [Debugging & Profiling at Scale](#16-debugging--profiling-at-scale)
17. [Interview Questions & What They're Really Asking](#17-interview-questions--what-theyre-really-asking)


## 1. WHAT PYTORCH ACTUALLY IS

PyTorch is two things fused together:

**A tensor computation library** (like NumPy but with GPU support): tensors, math ops, reshaping, indexing, and broadcasting.

**An automatic differentiation engine** (autograd): records operations, builds a computation graph, and computes gradients via backpropagation.

Everything else, nn.Module, DataLoader, optimizers, distributed training, is built on top of these two primitives.

**PyTorch vs TensorFlow (the historical context):**
TensorFlow 1.x used "define-then-run": you built a static computation graph, then executed it. Debugging was painful because the graph was compiled before you saw data.

PyTorch uses "define-by-run" (eager execution): operations execute immediately as Python runs. The computation graph is built dynamically each forward pass. This means you can use standard Python control flow (if/else, for loops) and debug with print statements. This flexibility is why PyTorch dominates research.

**Why this matters for an infra role:** You're building systems that run on top of these primitives. Understanding what happens inside `loss.backward()` or why `.contiguous()` copies data is the difference between debugging a distributed training crash in minutes vs. days.


## 2. TENSORS: THE MENTAL MODEL

### What a tensor IS

A tensor is an N-dimensional array of numbers with a fixed data type. That's the entire definition.

```
Scalar  (0D):  42                          shape: ()
Vector  (1D):  [1, 2, 3]                   shape: (3,)
Matrix  (2D):  [[1, 2], [3, 4]]            shape: (2, 2)
3D:            A stack of matrices          shape: (D0, D1, D2)
4D:            A batch of 3D tensors        shape: (batch, channels, height, width)
```

**Dimension naming conventions in ML:**
- Images: `(N, C, H, W)` = batch, channels, height, width
- Sequences/NLP: `(N, L, D)` = batch, sequence_length, embedding_dim
- Proteins (at Biohub): `(N, L, F)` = batch, residue_length, features

### Creating tensors

```python
import torch

# From Python data
torch.tensor([1, 2, 3])                      # int64 by default
torch.tensor([1.0, 2.0, 3.0])                # float32 by default
torch.tensor([[1, 2], [3, 4]], dtype=torch.float32)

# Filled tensors
torch.zeros(3, 4)                             # all 0.0
torch.ones(2, 3)                              # all 1.0
torch.full((3, 3), 3.14)                      # all 3.14
torch.empty(5, 5)                             # uninitialized (garbage)
torch.eye(4)                                  # identity matrix

# Ranges
torch.arange(0, 10, 2)                        # [0, 2, 4, 6, 8]
torch.linspace(0, 1, steps=5)                 # [0, 0.25, 0.5, 0.75, 1.0]

# Random
torch.rand(3, 4)                              # uniform [0, 1)
torch.randn(3, 4)                             # normal(0, 1)
torch.randint(0, 10, (3, 4))                  # random ints [0, 10)

# From another tensor's properties
x = torch.randn(3, 4, device='cuda', dtype=torch.float16)
y = torch.zeros_like(x)                       # same shape, dtype, device
z = torch.empty_like(x)
```


## 3. TENSOR MEMORY: STORAGE, STRIDES, CONTIGUITY

**This is the single most important conceptual section for an infra engineer.** Most bugs in large-scale training trace back to misunderstanding tensor memory layout.

### The Three Pieces

Every tensor is described by three things:

1. **Storage**: a flat, 1D block of memory holding the raw numbers
2. **Shape**: the logical dimensions (e.g., 2×3×4)
3. **Stride**: how many elements to skip in storage to move one step along each dimension

```python
t = torch.tensor([[1, 2, 3],
                   [4, 5, 6]])

# What Python shows you:     What's actually in memory:
# [[1, 2, 3],                [1, 2, 3, 4, 5, 6]
#  [4, 5, 6]]                 ← one flat array

t.shape          # torch.Size([2, 3])
t.stride()       # (3, 1)
#                   ↑  ↑
#                   |  └── to move one step in dim 1 (next column): skip 1 element
#                   └───── to move one step in dim 0 (next row): skip 3 elements

t.storage_offset()  # 0 — where this tensor starts in storage
```

### How to compute element location

```
element[i, j] = storage[offset + i * stride[0] + j * stride[1]]

Example: t[1, 2]
= storage[0 + 1*3 + 2*1]
= storage[5]
= 6  ✓
```

### Why this matters: View operations are FREE

When you reshape a tensor, PyTorch doesn't copy data. It just changes the shape and stride metadata:

```python
t = torch.arange(12)         # [0, 1, 2, ..., 11]
# Storage: [0,1,2,3,4,5,6,7,8,9,10,11]
# Shape: (12,)   Stride: (1,)

a = t.view(3, 4)
# Storage: [0,1,2,3,4,5,6,7,8,9,10,11]  ← SAME memory!
# Shape: (3, 4)   Stride: (4, 1)

b = t.view(2, 2, 3)
# Storage: [0,1,2,3,4,5,6,7,8,9,10,11]  ← STILL same memory!
# Shape: (2, 2, 3)   Stride: (6, 3, 1)

# All three tensors share the SAME storage
t[0] = 99
print(a[0, 0])    # 99 — same memory!
```

### The transpose problem: non-contiguous tensors

```python
t = torch.tensor([[1, 2, 3],
                   [4, 5, 6]])
# Shape: (2, 3)   Stride: (3, 1)   Contiguous: YES
# Storage: [1, 2, 3, 4, 5, 6]

t2 = t.T   # transpose
# Shape: (3, 2)   Stride: (1, 3)   Contiguous: NO
# Storage: [1, 2, 3, 4, 5, 6]  ← SAME storage, just different strides!
#
# To read t2 row-by-row:
# t2[0,0] = storage[0*1 + 0*3] = storage[0] = 1
# t2[0,1] = storage[0*1 + 1*3] = storage[3] = 4
# t2[1,0] = storage[1*1 + 0*3] = storage[1] = 2
# t2[1,1] = storage[1*1 + 1*3] = storage[4] = 5
# t2[2,0] = storage[2*1 + 0*3] = storage[2] = 3
# t2[2,1] = storage[2*1 + 1*3] = storage[5] = 6
#
# Logical view of t2: [[1, 4],     Memory access pattern: 0, 3, 1, 4, 2, 5
#                       [2, 5],     ← jumping around! Not sequential!
#                       [3, 6]]

t2.is_contiguous()  # False — elements aren't sequential in memory
```

**Why contiguity matters:**
- `view()` REQUIRES contiguous memory. It will throw `RuntimeError` on non-contiguous tensors.
- `reshape()` works on anything: it calls `view()` if contiguous, otherwise copies.
- Non-contiguous tensors have worse cache performance (CPU jumps around in memory).
- Some CUDA kernels require contiguous input.

```python
# The fix:
t2.contiguous()          # creates a NEW storage with sequential layout
# Now: Storage: [1, 4, 2, 5, 3, 6]   Stride: (2, 1)   Contiguous: YES

# In practice, use reshape() to avoid thinking about it:
t2.reshape(-1)           # always works, copies only if needed
```

**⚠️ INTERVIEW QUESTION: "What's the difference between view() and reshape()?"**
- `view()`: only changes metadata (shape/stride). Zero cost. Requires contiguous. Shares memory.
- `reshape()`: tries `view()` first. If tensor is non-contiguous, falls back to making a contiguous copy. May or may not share memory.
- `contiguous()`: returns self if already contiguous (free), otherwise copies data to a new contiguous storage.


## 4. TENSOR OPERATIONS & SYNTAX REFERENCE

### Shape manipulation

```python
t = torch.randn(2, 3, 4)

# Reshape
t.view(6, 4)              # (6, 4) — must be contiguous
t.reshape(6, 4)            # (6, 4) — always works
t.view(-1)                 # (24,)  — flatten
t.view(2, -1)              # (2, 12) — infer dim

# Transpose / Permute
m = torch.randn(3, 4)
m.T                        # (4, 3) — same as m.t()
t.permute(2, 0, 1)         # (4, 2, 3) — reorder ALL dims

# Squeeze / Unsqueeze
x = torch.randn(1, 3, 1, 4)
x.squeeze()                # (3, 4) — remove ALL size-1 dims
x.squeeze(0)               # (3, 1, 4) — remove specific
x.squeeze(2)               # (1, 3, 4) — remove specific

y = torch.randn(3, 4)
y.unsqueeze(0)             # (1, 3, 4) — add dim at position 0
y.unsqueeze(-1)            # (3, 4, 1) — add dim at end
y[None, :]                 # (1, 3, 4) — same as unsqueeze(0)
y[:, :, None]              # (3, 4, 1) — same as unsqueeze(-1)

# Flatten
t.flatten()                # (24,) — all dims
t.flatten(start_dim=1)     # (2, 12) — flatten dims 1 and 2

# Concat / Stack
a = torch.randn(3, 4)
b = torch.randn(3, 4)
torch.cat([a, b], dim=0)   # (6, 4) — join along EXISTING dim
torch.stack([a, b], dim=0)  # (2, 3, 4) — create NEW dim
torch.cat([a, b], dim=1)   # (3, 8)

# Expand / Repeat
t = torch.randn(1, 3)
t.expand(4, 3)             # (4, 3) — NO copy, broadcasts
t.expand(4, -1)            # (4, 3) — -1 means "keep"
t.repeat(4, 1)             # (4, 3) — COPIES data
t.repeat(4, 2)             # (4, 6) — copies and tiles
```

### Math operations

```python
a = torch.randn(3, 4)
b = torch.randn(3, 4)

# Element-wise
a + b                       # addition
a * b                       # element-wise multiply (Hadamard)
a / b                       # division
a ** 2                      # power
torch.sqrt(a.abs())
torch.exp(a)
torch.log(a.abs())
torch.clamp(a, min=-1, max=1)   # clip values
torch.relu(a)                   # max(0, x)

# In-place operations (modify tensor directly, save memory)
a.add_(b)                   # a = a + b, but no new tensor allocated
a.mul_(2)                   # a = a * 2
a.zero_()                   # a = all zeros
a.fill_(3.14)               # a = all 3.14
# WARNING: in-place ops on tensors that require grad can cause errors

# Reductions
a.sum()                     # scalar — sum of all elements
a.sum(dim=0)                # (4,) — sum across rows
a.sum(dim=1, keepdim=True)  # (3, 1) — keep dimension
a.mean()                    # mean of all
a.mean(dim=-1)              # mean along last dim
a.std()                     # standard deviation
a.max()                     # global max (scalar)
a.max(dim=1)                # returns (values, indices) tuple
a.argmax(dim=1)             # indices only
a.min()
a.norm(p=2)                 # L2 norm
a.norm(p=2, dim=1)          # per-row L2 norm

# Matrix operations
x = torch.randn(3, 4)
y = torch.randn(4, 5)
z = x @ y                   # (3, 5) matrix multiply — PREFERRED syntax
z = torch.mm(x, y)          # same, explicit
z = torch.matmul(x, y)      # same, also handles batched

# Batch matrix multiply
bx = torch.randn(8, 3, 4)   # batch of 8 matrices
by = torch.randn(8, 4, 5)
bz = torch.bmm(bx, by)      # (8, 3, 5)
bz = bx @ by                # same — @ handles batched

# Einstein summation (powerful shorthand)
torch.einsum('ij,jk->ik', x, y)              # matmul
torch.einsum('bij,bjk->bik', bx, by)          # batch matmul
torch.einsum('ij->i', x)                      # sum along columns
torch.einsum('ii->', torch.eye(4))             # trace
```

### Indexing

```python
t = torch.arange(20).reshape(4, 5)

# Basic slicing (returns VIEWS — shared memory)
t[0]                 # first row
t[1:3]               # rows 1, 2
t[:, 2]              # column 2
t[::2]               # every other row
t[:, -1]             # last column

# Boolean masking (returns COPY)
mask = t > 10
t[mask]               # 1D tensor of elements where mask is True
t[t % 3 == 0]         # elements divisible by 3

# Fancy indexing (returns COPY)
indices = torch.tensor([0, 2, 3])
t[indices]            # rows 0, 2, 3

# Scatter / Gather (important for embeddings, loss functions)
# gather: select elements along a dim using index tensor
src = torch.randn(3, 4)
idx = torch.tensor([[0, 1, 2, 3], [3, 2, 1, 0], [0, 0, 0, 0]])
torch.gather(src, dim=1, index=idx)   # picks src[i, idx[i,j]] for each (i,j)

# where
torch.where(t > 10, t, torch.zeros_like(t))  # keep if >10, else 0
```


## 5. AUTOGRAD: HOW GRADIENTS ACTUALLY FLOW

### The Computation Graph

When a tensor has `requires_grad=True`, every operation on it is recorded in a directed acyclic graph (DAG). Each node in the graph stores:
- The operation that created the tensor (`grad_fn`)
- References to the input tensors
- Any data needed to compute the backward pass (saved tensors)

```python
x = torch.tensor(2.0, requires_grad=True)
y = torch.tensor(3.0, requires_grad=True)

# Forward pass builds the graph:
a = x * y          # a.grad_fn = <MulBackward0>
b = a + x          # b.grad_fn = <AddBackward0>
c = b ** 2          # c.grad_fn = <PowBackward0>

# The graph looks like:
#   x ──┬── MulBackward ── AddBackward ── PowBackward → c
#   y ──┘        │              │
#                └──────────────┘ (x feeds into both Mul and Add)
```

### backward(): Walking the Graph in Reverse

```python
c.backward()

# What happens internally:
# 1. Start at c, gradient = 1.0 (dc/dc = 1)
# 2. PowBackward: dc/db = 2*b = 2*(a+x) = 2*(6+2) = 16
# 3. AddBackward: dc/da = 16, dc/dx_via_add = 16
# 4. MulBackward: dc/dx_via_mul = 16 * y = 48, dc/dy = 16 * x = 32
# 5. Total dc/dx = dc/dx_via_add + dc/dx_via_mul = 16 + 48 = 64

print(x.grad)   # tensor(64.)
print(y.grad)   # tensor(32.)
```

**Key behaviors:**
```python
# The graph is DESTROYED after backward() (by default)
c.backward()
# c.backward()  ← would crash! Graph is freed.
# To keep it: c.backward(retain_graph=True)

# Gradients ACCUMULATE (they're summed, not replaced)
x.grad           # has a value from first backward
loss.backward()  # x.grad += new gradients
# That's why you need optimizer.zero_grad() every iteration

# Leaf tensors vs intermediate tensors
x = torch.randn(3, requires_grad=True)   # LEAF — user-created, grad stored
y = x * 2                                 # INTERMEDIATE — grad not stored by default
y.retain_grad()                            # explicitly request storage
```

### Disabling gradient tracking

```python
# no_grad — for inference and parameter updates
with torch.no_grad():
    output = model(input)    # no graph built, saves memory
    param -= lr * param.grad # manual update without tracking

# inference_mode — even stricter, even faster
with torch.inference_mode():
    output = model(input)    # cannot use these tensors in any grad computation later

# detach — disconnect a tensor from the graph
z = some_tensor.detach()     # z shares data but has no grad_fn
# Common use: when you need a tensor's VALUE but not its gradient history
# Example: target computation in reinforcement learning
```

**⚠️ INTERVIEW QUESTION: "When would you use no_grad vs inference_mode vs detach?"**
- `no_grad`: validation loops, manual parameter updates, computing metrics. Tensors CAN be used in later grad computations.
- `inference_mode`: pure inference (serving). Fastest. Tensors CANNOT be used in grad computations later.
- `detach`: when you need to stop gradient flow at a specific point in the graph, e.g., detaching a target network in RL.


## 6. nn.Module: ANATOMY OF A MODEL

### The Three Kinds of State

An `nn.Module` has three types of state, and understanding the difference is critical:

**Parameters** (`nn.Parameter`): learned weights. `requires_grad=True`. Updated by the optimizer. Saved in `state_dict`. Moved by `.to(device)`.

**Buffers** (`register_buffer`): non-learned state that's part of the model. `requires_grad=False`. Saved in `state_dict`. Moved by `.to(device)`. Example: BatchNorm's running mean/variance.

**Plain attributes**: Python attributes. NOT in `state_dict`. NOT moved by `.to()`. Example: config values, hyperparameters.

```python
import torch.nn as nn

class MyModel(nn.Module):
    def __init__(self, input_dim, hidden_dim, num_classes):
        super().__init__()
        
        # PARAMETERS — learned, in state_dict, moved by .to()
        self.linear1 = nn.Linear(input_dim, hidden_dim)  # has .weight and .bias params
        self.linear2 = nn.Linear(hidden_dim, num_classes)
        
        # BUFFER — not learned, but in state_dict, moved by .to()
        # Example: a fixed positional encoding or a running count
        self.register_buffer('step_count', torch.zeros(1))
        
        # PLAIN ATTRIBUTE — not in state_dict, not moved
        self.hidden_dim = hidden_dim  # just a config value
    
    def forward(self, x):
        self.step_count += 1               # buffers update without grad
        x = torch.relu(self.linear1(x))
        return self.linear2(x)
```

**⚠️ INTERVIEW QUESTION: "When would you use register_buffer vs nn.Parameter vs a plain attribute?"**
- `nn.Parameter`: anything the optimizer should update (weights, biases, learnable scalars).
- `register_buffer`: tensors that should move to GPU with the model and be saved/loaded, but NOT optimized. Examples: BatchNorm running stats, fixed positional encodings, input normalization means/stds.
- Plain attribute: non-tensor config (dimensions, dropout rate, number of heads). Or tensors you explicitly DON'T want saved/moved.


### Module hierarchy and named_parameters

```python
model = MyModel(64, 128, 10)

# Iterate all parameters (recursive through submodules)
for name, param in model.named_parameters():
    print(f"{name}: shape={param.shape}, requires_grad={param.requires_grad}")
# linear1.weight: shape=torch.Size([128, 64]), requires_grad=True
# linear1.bias: shape=torch.Size([128]), requires_grad=True
# linear2.weight: shape=torch.Size([10, 128]), requires_grad=True
# linear2.bias: shape=torch.Size([10]), requires_grad=True

# Iterate buffers
for name, buf in model.named_buffers():
    print(f"{name}: {buf}")
# step_count: tensor([0.])

# Iterate submodules
for name, module in model.named_modules():
    print(f"{name}: {type(module).__name__}")
# '': MyModel
# linear1: Linear
# linear2: Linear

# Count parameters
total_params = sum(p.numel() for p in model.parameters())
trainable = sum(p.numel() for p in model.parameters() if p.requires_grad)
```


### Common layers reference

```python
# Linear (fully connected)
nn.Linear(in_features=64, out_features=128, bias=True)
# Applies: y = x @ W.T + b   where W is (128, 64), b is (128,)

# Convolution
nn.Conv2d(in_channels=3, out_channels=64, kernel_size=3, stride=1, padding=1)
# Input: (N, 3, H, W) → Output: (N, 64, H, W)

# Normalization
nn.BatchNorm1d(num_features=128)     # for (N, 128) or (N, 128, L)
nn.BatchNorm2d(num_features=64)      # for (N, 64, H, W)
nn.LayerNorm(normalized_shape=128)   # normalizes over last dim(s)
nn.GroupNorm(num_groups=8, num_channels=64)

# Activation
nn.ReLU()
nn.GELU()
nn.SiLU()               # also called Swish

# Dropout
nn.Dropout(p=0.1)        # randomly zeros elements during training

# Embedding
nn.Embedding(num_embeddings=10000, embedding_dim=256)
# Input: (N, L) of int indices → Output: (N, L, 256)

# Transformer building blocks
nn.MultiheadAttention(embed_dim=256, num_heads=8)
nn.TransformerEncoderLayer(d_model=256, nhead=8, dim_feedforward=1024)

# Sequential — chain layers linearly
model = nn.Sequential(
    nn.Linear(64, 128),
    nn.ReLU(),
    nn.Linear(128, 10),
)
```

### Hooks: Intercepting Forward/Backward

Hooks let you inspect or modify tensors as they flow through the model. Essential for debugging, feature extraction, and gradient surgery.

```python
# Forward hook — runs after a module's forward()
activations = {}
def save_activation(name):
    def hook(module, input, output):
        activations[name] = output.detach()
    return hook

model.linear1.register_forward_hook(save_activation('linear1'))
output = model(x)
print(activations['linear1'].shape)   # captured intermediate output

# Backward hook — runs when gradients flow through a module
def print_grad(name):
    def hook(module, grad_input, grad_output):
        print(f"{name} grad_output norm: {grad_output[0].norm():.4f}")
    return hook

model.linear2.register_full_backward_hook(print_grad('linear2'))
loss.backward()  # prints gradient norm as it flows through linear2
```


## 7. THE TRAINING LOOP: EVERY MOVING PART

Here is a training loop with every component labeled:

```python
import torch
import torch.nn as nn
from torch.utils.data import DataLoader

# ── Setup ──
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
model = MyModel(input_dim=64, hidden_dim=256, num_classes=10).to(device)
criterion = nn.CrossEntropyLoss()
optimizer = torch.optim.AdamW(model.parameters(), lr=1e-3, weight_decay=0.01)
scheduler = torch.optim.lr_scheduler.CosineAnnealingLR(optimizer, T_max=100)

train_loader = DataLoader(train_dataset, batch_size=32, shuffle=True, 
                          num_workers=4, pin_memory=True)
val_loader = DataLoader(val_dataset, batch_size=64, shuffle=False,
                        num_workers=4, pin_memory=True)

# ── Training ──
for epoch in range(100):
    
    # ── Train phase ──
    model.train()  # enables dropout, batchnorm uses batch stats
    train_loss = 0.0
    
    for batch_idx, (data, target) in enumerate(train_loader):
        data = data.to(device, non_blocking=True)     # [1] move to GPU
        target = target.to(device, non_blocking=True)
        
        optimizer.zero_grad()       # [2] clear old gradients
        # Alternative: optimizer.zero_grad(set_to_none=True)  ← slightly faster
        
        output = model(data)        # [3] forward pass — builds computation graph
        loss = criterion(output, target)  # [4] compute loss
        
        loss.backward()             # [5] backward pass — compute gradients
        
        # [6] Optional: gradient clipping (prevents exploding gradients)
        torch.nn.utils.clip_grad_norm_(model.parameters(), max_norm=1.0)
        
        optimizer.step()            # [7] update parameters using gradients
        
        train_loss += loss.item()   # .item() extracts Python float, frees tensor
    
    # ── Validation phase ──
    model.eval()   # disables dropout, batchnorm uses running stats
    val_loss = 0.0
    correct = 0
    
    with torch.no_grad():  # [8] no gradient computation — saves memory + speed
        for data, target in val_loader:
            data = data.to(device, non_blocking=True)
            target = target.to(device, non_blocking=True)
            
            output = model(data)
            val_loss += criterion(output, target).item()
            
            pred = output.argmax(dim=1)
            correct += (pred == target).sum().item()
    
    # ── Scheduler step ──
    scheduler.step()   # [9] update learning rate
    
    # ── Logging ──
    avg_train = train_loss / len(train_loader)
    avg_val = val_loss / len(val_loader)
    accuracy = correct / len(val_dataset)
    lr = optimizer.param_groups[0]['lr']
    print(f"Epoch {epoch} | Train: {avg_train:.4f} | Val: {avg_val:.4f} | "
          f"Acc: {accuracy:.4f} | LR: {lr:.6f}")
```

**⚠️ INTERVIEW QUESTION: "Walk me through what happens in each step of a training iteration."**

1. **Data to GPU**: `non_blocking=True` with `pin_memory` = async transfer, GPU doesn't wait
2. **Zero gradients**: gradients accumulate by default, must reset. `set_to_none=True` is faster (sets to None instead of filling with 0)
3. **Forward pass**: data flows through layers, autograd records operations in DAG
4. **Loss computation**: single scalar that measures error
5. **Backward pass**: autograd walks DAG in reverse, computing gradients via chain rule. Gradient for each parameter stored in `param.grad`
6. **Gradient clipping**: rescale gradients if their total norm exceeds a threshold. Prevents one bad batch from destroying training
7. **Optimizer step**: applies update rule (e.g., Adam: uses gradient + momentum + adaptive learning rate)
8. **no_grad for eval**: no graph built = ~50% less memory, faster
9. **Scheduler**: adjusts LR. Common schedule: warmup → cosine decay

**⚠️ INTERVIEW QUESTION: "What's the difference between model.train() and model.eval()?"**
- `model.train()`: Dropout is active (randomly zeros elements). BatchNorm uses current batch statistics.
- `model.eval()`: Dropout is disabled (all elements pass through). BatchNorm uses stored running statistics.
- These ONLY affect layers with train/eval-dependent behavior. They do NOT disable gradient computation: you still need `torch.no_grad()` for that.


## 8. OPTIMIZERS & LEARNING RATE SCHEDULES

### Common optimizers

```python
# SGD — simple, needs momentum for good results
torch.optim.SGD(params, lr=0.01, momentum=0.9, weight_decay=1e-4)

# Adam — adaptive learning rate per parameter, default choice
torch.optim.Adam(params, lr=1e-3, betas=(0.9, 0.999), eps=1e-8)

# AdamW — Adam with decoupled weight decay (PREFERRED for transformers)
torch.optim.AdamW(params, lr=1e-3, weight_decay=0.01)
# AdamW applies weight decay DIRECTLY to parameters, not through gradients
# This is mathematically different from Adam + L2 regularization
```

**⚠️ INTERVIEW QUESTION: "Why AdamW instead of Adam?"**
In Adam, weight decay is mixed into the gradient, which interacts badly with the adaptive learning rate. AdamW decouples them: the gradient-based update and the weight decay are applied separately. This gives better regularization, especially for large models.

### Per-parameter-group options

You can set different learning rates for different parts of the model:
```python
optimizer = torch.optim.AdamW([
    {'params': model.backbone.parameters(), 'lr': 1e-5},   # low LR for pretrained
    {'params': model.head.parameters(), 'lr': 1e-3},       # high LR for new layers
], weight_decay=0.01)
```

### Learning rate schedules

```python
# Step decay — multiply LR by gamma every step_size epochs
scheduler = torch.optim.lr_scheduler.StepLR(optimizer, step_size=30, gamma=0.1)

# Cosine annealing — smooth decay from initial LR to near zero
scheduler = torch.optim.lr_scheduler.CosineAnnealingLR(optimizer, T_max=100, eta_min=1e-6)

# Cosine with warm restarts — periodic resets
scheduler = torch.optim.lr_scheduler.CosineAnnealingWarmRestarts(
    optimizer, T_0=50, T_mult=2, eta_min=1e-6
)

# Reduce on plateau — lower LR when metric stops improving
scheduler = torch.optim.lr_scheduler.ReduceLROnPlateau(
    optimizer, mode='min', factor=0.5, patience=10
)
# Note: this one takes a metric: scheduler.step(val_loss)

# Linear warmup (manual — PyTorch doesn't have a built-in one)
def warmup_lambda(current_step):
    warmup_steps = 1000
    if current_step < warmup_steps:
        return current_step / warmup_steps
    return 1.0
scheduler = torch.optim.lr_scheduler.LambdaLR(optimizer, lr_lambda=warmup_lambda)

# Warmup + cosine (common for transformer training)
def warmup_cosine(step):
    warmup_steps = 1000
    total_steps = 50000
    if step < warmup_steps:
        return step / warmup_steps
    progress = (step - warmup_steps) / (total_steps - warmup_steps)
    return 0.5 * (1 + math.cos(math.pi * progress))

scheduler = torch.optim.lr_scheduler.LambdaLR(optimizer, lr_lambda=warmup_cosine)
```

**Why warmup?** At the start of training, the model weights are random and produce large, noisy gradients. A large learning rate + noisy gradients = chaotic updates that the model may never recover from. Warmup starts with a tiny LR, letting the model "settle" before ramping up.


## 9. DATA LOADING PIPELINE

*(Covered in depth in the previous guide. Key additions for interview context:)*

**⚠️ INTERVIEW QUESTION: "How would you design a data pipeline for a 10TB microscopy dataset?"**

Answer framework:
1. **Don't load into memory.** Use memory-mapped files (np.mmap) or chunked formats (Zarr/HDF5).
2. **Shard the data.** Split into ~1000 files of ~10GB each. Each DataLoader worker reads different shards.
3. **Use IterableDataset** if you can't index the full dataset (e.g., streaming from cloud storage).
4. **Pre-compute indices.** Build a lightweight index file mapping sample IDs to (shard_file, offset).
5. **Match chunk size to access pattern.** If you read one image at a time, chunk as one-image-per-chunk.
6. **For distributed training**, use `DistributedSampler` to split shards across GPUs without overlap.


## 10. SAVING & LOADING: state_dict MECHANICS

### What state_dict actually is

```python
model = nn.Linear(3, 2)
print(model.state_dict())
# OrderedDict([
#   ('weight', tensor([[ 0.12, -0.34,  0.56], [-0.78, 0.90, -0.12]])),
#   ('bias',   tensor([0.23, -0.45]))
# ])
# Keys = parameter names (hierarchical, dot-separated for nested modules)
# Values = tensor data
```

### Save patterns

```python
# PATTERN 1: Save only state dict (RECOMMENDED)
torch.save(model.state_dict(), 'model_weights.pt')

# Load:
model = MyModel(...)       # must create model with same architecture first
model.load_state_dict(torch.load('model_weights.pt', weights_only=True))

# PATTERN 2: Save full checkpoint (for resuming training)
torch.save({
    'epoch': epoch,
    'model_state_dict': model.state_dict(),
    'optimizer_state_dict': optimizer.state_dict(),
    'scheduler_state_dict': scheduler.state_dict(),
    'loss': loss,
    'config': config,
}, 'checkpoint.pt')

# Load:
ckpt = torch.load('checkpoint.pt', weights_only=False)
model.load_state_dict(ckpt['model_state_dict'])
optimizer.load_state_dict(ckpt['optimizer_state_dict'])
start_epoch = ckpt['epoch'] + 1

# PATTERN 3: Partial loading (fine-tuning, architecture changes)
state = torch.load('pretrained.pt', weights_only=True)
model.load_state_dict(state, strict=False)
# strict=False: ignores missing/unexpected keys
# Returns: <IncompatibleKeys(missing_keys=[...], unexpected_keys=[...])>
```

**⚠️ INTERVIEW QUESTION: "Why save state_dict instead of the whole model?"**
- `torch.save(model)` pickles the entire Python object, including the class definition. If you rename the class, move it to a different file, or change its constructor, loading breaks.
- `torch.save(model.state_dict())` saves just the tensor data keyed by name. You recreate the model architecture in code, then load the weights. Much more portable and robust.


## 11. GPU PROGRAMMING: DEVICE MANAGEMENT

```python
# Check availability
torch.cuda.is_available()          # True/False
torch.cuda.device_count()         # number of GPUs
torch.cuda.current_device()       # current GPU index
torch.cuda.get_device_name(0)     # "NVIDIA A100-SXM4-80GB"

# Memory info
torch.cuda.memory_allocated()      # currently used by tensors (bytes)
torch.cuda.memory_reserved()       # total reserved by caching allocator
torch.cuda.max_memory_allocated()  # peak usage (for debugging OOM)

# Device object
device = torch.device('cuda:0')    # specific GPU
device = torch.device('cuda')      # current default GPU

# Moving data
t = torch.randn(3, 4)
t_gpu = t.to(device)               # copy to GPU
t_gpu = t.cuda()                   # shorthand
t_cpu = t_gpu.cpu()                # back to CPU

# Create on GPU directly
t = torch.randn(3, 4, device=device)  # no transfer needed

# CRITICAL: operations require same device
a = torch.randn(3, device='cuda:0')
b = torch.randn(3, device='cuda:1')
# a + b  ← RuntimeError! Different devices.
# a + b.to('cuda:0')  ← works

# Emptying cache (doesn't free memory, just returns it to allocator)
torch.cuda.empty_cache()

# Synchronization
torch.cuda.synchronize()   # wait for all GPU operations to finish
# GPU ops are async — Python returns immediately, GPU runs in background
# synchronize() blocks until all GPU work is done
# Needed before timing GPU operations
```

**⚠️ INTERVIEW QUESTION: "How do you debug a CUDA out-of-memory error?"**
1. `torch.cuda.max_memory_allocated()`: find peak usage
2. Reduce batch size (most common fix)
3. Use `torch.cuda.memory_summary()`: detailed breakdown
4. Enable gradient checkpointing (recompute activations in backward instead of storing)
5. Use mixed precision (float16/bfloat16 = half the memory)
6. Use FSDP to shard model across GPUs
7. Check for memory leaks: are you storing tensors in lists across iterations?


## 12. MIXED PRECISION TRAINING

### The concept

Most tensor operations don't need full float32 precision. Mixed precision uses float16 or bfloat16 for compute-heavy operations (matrix multiplies) and keeps float32 for precision-sensitive ones (loss computation, softmax, normalization).

**Benefits:** ~2x faster compute, ~2x less memory for activations. On A100s with bfloat16, you can fit ~2x the batch size.

**The problem with float16:** The range is only ±65504. Gradients can be tiny (1e-8), which rounds to 0 in float16 ("underflow"). Solution: GradScaler multiplies the loss by a large factor before backward, making gradients bigger. Then it divides them back before the optimizer step.

**bfloat16 doesn't need scaling** because it has the same range as float32 (just less precision). On modern GPUs (A100+), prefer bfloat16.

```python
from torch.amp import autocast, GradScaler

# With float16 (needs scaler)
scaler = GradScaler()
for data, target in loader:
    optimizer.zero_grad()
    with autocast(device_type='cuda', dtype=torch.float16):
        output = model(data)
        loss = criterion(output, target)
    scaler.scale(loss).backward()
    scaler.step(optimizer)         # internally unscales, then steps
    scaler.update()                # adjusts scale factor dynamically

# With bfloat16 (no scaler needed)
for data, target in loader:
    optimizer.zero_grad()
    with autocast(device_type='cuda', dtype=torch.bfloat16):
        output = model(data)
        loss = criterion(output, target)
    loss.backward()
    optimizer.step()
```


## 13. DISTRIBUTED TRAINING: DDP FROM SCRATCH

### The Mental Model

**Data Parallel (DP):** One master GPU sends data to other GPUs, collects outputs, computes loss and gradients on master, broadcasts parameters. Simple but creates a bottleneck at the master GPU. **Don't use this**: it's the old way.

**Distributed Data Parallel (DDP):** Each GPU is an independent process with its own model copy. No master. Data is split via `DistributedSampler`. After backward pass, gradients are synchronized via all-reduce (every GPU sends/receives equally). Then each GPU updates its own copy independently: because they all started with the same parameters and applied the same averaged gradients, they stay in sync.

### How all-reduce works (ring algorithm)

Imagine 4 GPUs, each has gradient vector G, split into 4 chunks:

```
Step 1-3 (Reduce-Scatter): Each GPU sends one chunk to its neighbor.
After receiving, it ADDS the received chunk to its own.
After 3 steps, each GPU has the SUM of one chunk across all GPUs.

Step 4-6 (All-Gather): Each GPU sends its completed sum to neighbors.
After 3 steps, every GPU has the complete summed gradient.

Total data sent per GPU: 2 × (N/P) × (P-1)
  where N = gradient size, P = number of GPUs
Key insight: bandwidth per GPU is CONSTANT regardless of P.
```

### Complete DDP Training Script

```python
import os
import torch
import torch.nn as nn
import torch.distributed as dist
from torch.nn.parallel import DistributedDataParallel as DDP
from torch.utils.data import DataLoader, DistributedSampler

def main():
    # ── Initialize distributed ──
    # torchrun sets RANK, LOCAL_RANK, WORLD_SIZE as env vars
    dist.init_process_group(backend="nccl")  # NCCL = fastest for GPU
    rank = int(os.environ["RANK"])
    local_rank = int(os.environ["LOCAL_RANK"])
    world_size = int(os.environ["WORLD_SIZE"])
    torch.cuda.set_device(local_rank)
    device = torch.device(f"cuda:{local_rank}")
    
    # ── Model ──
    model = MyModel().to(device)
    model = DDP(model, device_ids=[local_rank])
    
    # ── Data ──
    dataset = MyDataset("/data/train")
    sampler = DistributedSampler(dataset, num_replicas=world_size, rank=rank, shuffle=True)
    loader = DataLoader(
        dataset, batch_size=32, sampler=sampler,
        num_workers=4, pin_memory=True, drop_last=True,
    )
    
    # ── Optimizer ──
    optimizer = torch.optim.AdamW(model.parameters(), lr=1e-3)
    scaler = torch.amp.GradScaler()
    
    # ── Resume from checkpoint ──
    start_epoch = 0
    ckpt_path = "latest_checkpoint.pt"
    if os.path.exists(ckpt_path):
        # All ranks load (they all need the same state)
        ckpt = torch.load(ckpt_path, map_location=device, weights_only=False)
        model.module.load_state_dict(ckpt["model"])
        optimizer.load_state_dict(ckpt["optimizer"])
        start_epoch = ckpt["epoch"] + 1
        if rank == 0:
            print(f"Resumed from epoch {start_epoch}")
    
    # ── Training loop ──
    for epoch in range(start_epoch, 100):
        sampler.set_epoch(epoch)       # CRITICAL for proper shuffling
        model.train()
        
        for step, (data, target) in enumerate(loader):
            data = data.to(device, non_blocking=True)
            target = target.to(device, non_blocking=True)
            
            optimizer.zero_grad(set_to_none=True)
            
            with torch.amp.autocast(device_type='cuda', dtype=torch.bfloat16):
                output = model(data)
                loss = nn.functional.cross_entropy(output, target)
            
            loss.backward()
            torch.nn.utils.clip_grad_norm_(model.parameters(), max_norm=1.0)
            optimizer.step()
            
            if rank == 0 and step % 100 == 0:
                print(f"Epoch {epoch} Step {step} Loss {loss.item():.4f}")
        
        # ── Save checkpoint (rank 0 only) ──
        if rank == 0:
            torch.save({
                "epoch": epoch,
                "model": model.module.state_dict(),   # .module!
                "optimizer": optimizer.state_dict(),
            }, ckpt_path)
        
        # Ensure all ranks wait for rank 0 to finish saving
        dist.barrier()
    
    dist.destroy_process_group()

if __name__ == "__main__":
    main()
```

```bash
# Launch: single node, 4 GPUs
torchrun --standalone --nproc_per_node=4 train.py

# Launch: 2 nodes, 4 GPUs each
# On node 0:
torchrun --nnodes=2 --nproc_per_node=4 --node_rank=0 \
         --master_addr=10.0.0.1 --master_port=29500 train.py
# On node 1:
torchrun --nnodes=2 --nproc_per_node=4 --node_rank=1 \
         --master_addr=10.0.0.1 --master_port=29500 train.py
```

### DDP Gotchas: The Complete List

```
1. sampler.set_epoch(epoch)
   Without this, every epoch uses the same data ordering.
   The sampler seeds its shuffle with the epoch number.

2. model.module.state_dict()
   DDP wraps your model. The real model is inside .module.
   Save model.module.state_dict(), not model.state_dict().
   (model.state_dict() adds "module." prefix to all keys)

3. Save on rank 0 only
   All ranks have identical parameters. Multiple saves = wasted I/O.

4. dist.barrier() after saving
   Prevents other ranks from trying to load a half-written checkpoint.

5. Don't use model.eval() with DDP and SyncBatchNorm
   SyncBatchNorm requires all ranks to participate. If one rank skips
   the forward pass (e.g., uneven data), it deadlocks.

6. drop_last=True
   If the last batch has fewer samples, different ranks may have
   different batch sizes, causing hanging during gradient sync.

7. map_location when loading checkpoints
   torch.load('ckpt.pt', map_location=device) — ensures tensors
   are loaded to the correct GPU, not all to GPU 0.
```

### Gradient Accumulation with DDP

```python
accumulation_steps = 4
# effective_batch = batch_size × accumulation_steps × world_size

for step, (data, target) in enumerate(loader):
    data, target = data.to(device), target.to(device)
    
    with torch.amp.autocast(device_type='cuda', dtype=torch.bfloat16):
        output = model(data)
        loss = nn.functional.cross_entropy(output, target)
        loss = loss / accumulation_steps
    
    # Skip gradient sync on non-boundary steps (saves communication)
    if (step + 1) % accumulation_steps != 0:
        with model.no_sync():      # DDP won't all-reduce here
            loss.backward()
    else:
        loss.backward()            # all-reduce happens here
        torch.nn.utils.clip_grad_norm_(model.parameters(), 1.0)
        optimizer.step()
        optimizer.zero_grad()
```

**⚠️ INTERVIEW QUESTION: "Why use model.no_sync() during gradient accumulation?"**
Every `backward()` in DDP triggers an all-reduce across all GPUs. If you're accumulating over 4 steps, the first 3 all-reduces are wasted: you only need to sync on the 4th. `no_sync()` is a context manager that tells DDP to skip the sync, reducing communication by 75%.


## 14. FSDP: WHEN MODELS DON'T FIT

### The Concept

DDP: every GPU has a FULL copy of the model. 7B params × 4 bytes = 28GB per GPU. With AdamW (2 extra states per param), that's 84GB. One A100 = 80GB. Doesn't fit.

FSDP: shards (splits) the model parameters, gradients, AND optimizer states across all GPUs. Each GPU holds only 1/N of everything.

```
DDP (4 GPUs):
  GPU 0: [full model] [full optimizer state] [full gradients]
  GPU 1: [full model] [full optimizer state] [full gradients]
  GPU 2: [full model] [full optimizer state] [full gradients]
  GPU 3: [full model] [full optimizer state] [full gradients]
  Total memory per GPU: ~3x model size

FSDP (4 GPUs):
  GPU 0: [1/4 model] [1/4 optimizer] [1/4 gradients]
  GPU 1: [1/4 model] [1/4 optimizer] [1/4 gradients]
  GPU 2: [1/4 model] [1/4 optimizer] [1/4 gradients]
  GPU 3: [1/4 model] [1/4 optimizer] [1/4 gradients]
  Total memory per GPU: ~3/4 x model size
```

**The tradeoff:** Before each layer's forward pass, FSDP must all-gather that layer's full parameters from all GPUs. After backward, it reduce-scatters the gradients. More communication, but much less memory.

```python
from torch.distributed.fsdp import FullyShardedDataParallel as FSDP
from torch.distributed.fsdp import MixedPrecision, ShardingStrategy
from torch.distributed.fsdp.wrap import transformer_auto_wrap_policy
import functools

# Wrap policy: tells FSDP where to shard (usually per transformer block)
wrap_policy = functools.partial(
    transformer_auto_wrap_policy,
    transformer_layer_cls={TransformerBlock},
)

# Mixed precision config
mp_policy = MixedPrecision(
    param_dtype=torch.bfloat16,
    reduce_dtype=torch.bfloat16,
    buffer_dtype=torch.bfloat16,
)

model = FSDP(
    model,
    auto_wrap_policy=wrap_policy,
    mixed_precision=mp_policy,
    sharding_strategy=ShardingStrategy.FULL_SHARD,
    device_id=local_rank,
)

# Training loop is the same as DDP
# BUT: model.state_dict() returns sharded tensors
# Use distributed checkpoint (DCP) for saving — see next section
```

**⚠️ INTERVIEW QUESTION: "When would you use DDP vs FSDP?"**
- **DDP** when the model fits on one GPU (parameters + optimizer + activations). Simpler, less communication overhead, faster per-step.
- **FSDP** when the model doesn't fit on one GPU. Cuts memory by N but adds communication (gather/scatter per layer).
- **Rule of thumb:** If model + optimizer < GPU memory, use DDP. Otherwise FSDP.

### Activation Checkpointing

Even with FSDP, activations (intermediate outputs of each layer, stored for backward pass) can eat GPU memory. Activation checkpointing discards them during forward and recomputes them during backward.

```python
from torch.distributed.algorithms._checkpoint.checkpoint_wrapper import (
    apply_activation_checkpointing,
)

# Checkpoint every transformer block — recompute activations during backward
apply_activation_checkpointing(
    model,
    check_fn=lambda module: isinstance(module, TransformerBlock),
)
# Tradeoff: ~30% slower but uses ~60% less memory for activations
```


## 15. DISTRIBUTED CHECKPOINTING

### The Problem

With FSDP, `model.state_dict()` returns sharded tensors: each GPU only has its piece. You can't just `torch.save()` from rank 0 because rank 0 doesn't have the full model.

### torch.distributed.checkpoint (DCP)

```python
import torch.distributed.checkpoint as dcp

# ── Save (ALL ranks participate) ──
state = {
    "model": model.state_dict(),
    "optimizer": optimizer.state_dict(),
    "epoch": epoch,
}
dcp.save(state, checkpoint_id="/checkpoints/step_10000")
# Each rank writes its shard to a separate file:
# /checkpoints/step_10000/.metadata
# /checkpoints/step_10000/__0_0.distcp
# /checkpoints/step_10000/__1_0.distcp
# ...

# ── Load (ALL ranks participate, reshards automatically) ──
state = {
    "model": model.state_dict(),
    "optimizer": optimizer.state_dict(),
}
dcp.load(state, checkpoint_id="/checkpoints/step_10000")
model.load_state_dict(state["model"])
optimizer.load_state_dict(state["optimizer"])

# KEY FEATURE: Save on 8 GPUs, load on 4 GPUs. DCP reshards automatically.
```

**⚠️ INTERVIEW QUESTION: "How do you checkpoint a model that's sharded across 64 GPUs?"**
Use `torch.distributed.checkpoint`. All ranks participate in both save and load. Each rank writes only its shard (parallel I/O, fast). The `.metadata` file records which shard is where. On load, DCP reads the metadata and routes data to the correct ranks, even if the number of GPUs changed.


## 16. DEBUGGING & PROFILING AT SCALE

### Common failures and fixes

```python
# ── NCCL Timeout (most common distributed failure) ──
# Symptom: training hangs, eventually NCCL timeout error
# Causes:
#   - One rank crashed or is stuck (check all processes)
#   - Uneven data across ranks (use drop_last=True)
#   - One rank hit an exception before a collective operation
# Debug:
os.environ["NCCL_DEBUG"] = "INFO"      # verbose NCCL logging
os.environ["NCCL_TIMEOUT"] = "1800"    # 30 min timeout (default is ~10 min)
# Also: TORCH_DISTRIBUTED_DEBUG=DETAIL

# ── OOM (Out of Memory) ──
print(torch.cuda.memory_summary())     # detailed breakdown
torch.cuda.max_memory_allocated() / 1e9  # peak GB

# ── Gradient anomalies ──
torch.autograd.set_detect_anomaly(True)  # catches NaN/Inf in backward
# Expensive! Use only for debugging.

# ── Finding unused parameters in DDP ──
model = DDP(model, find_unused_parameters=True)
# If any parameter doesn't contribute to loss, DDP will deadlock
# because it expects gradients from all parameters for all-reduce.
# find_unused_parameters=True handles this but is slower.
```

### Profiling

```python
# PyTorch Profiler
from torch.profiler import profile, record_function, ProfilerActivity

with profile(
    activities=[ProfilerActivity.CPU, ProfilerActivity.CUDA],
    record_shapes=True,
    with_stack=True,
) as prof:
    with record_function("training_step"):
        output = model(data)
        loss = criterion(output, target)
        loss.backward()

print(prof.key_averages().table(sort_by="cuda_time_total", row_limit=20))

# Check if data loading is the bottleneck
import time
for i, batch in enumerate(loader):
    if i == 0:
        t_start = time.perf_counter()
    if i == 10:
        per_batch = (time.perf_counter() - t_start) / 10
        print(f"Data loading: {per_batch*1000:.1f}ms per batch")
        break
```


## 17. INTERVIEW QUESTIONS & WHAT THEY'RE REALLY ASKING

### Tensor / Memory Questions

**Q: "What happens in memory when you transpose a tensor?"**
They're testing: Do you understand strides? Answer: Only metadata (stride) changes. No data is copied. The tensor becomes non-contiguous.

**Q: "view() vs reshape() vs contiguous()"**
They're testing: Do you know when copies happen? Answer: view = metadata only, requires contiguous. reshape = tries view, copies if needed. contiguous = copies only if not already contiguous.

### Training Questions

**Q: "Why do we call zero_grad()?"**
They're testing: Do you know gradients accumulate? Answer: PyTorch adds new gradients to existing .grad tensors. Without zeroing, you'd sum gradients across iterations. (This is actually useful for gradient accumulation, but must be intentional.)

**Q: "What's gradient clipping and why?"**
They're testing: Do you handle training instability? Answer: Rescales gradients if their norm exceeds a threshold. Prevents one bad batch from producing enormous gradients that destroy model weights. Especially important for transformers and RNNs.

### Architecture Questions

**Q: "register_buffer vs nn.Parameter?"**
They're testing: Do you understand model state? Answer: Both are saved in state_dict and moved by .to(device). Difference: Parameters have requires_grad=True and are updated by the optimizer. Buffers don't have gradients and aren't optimized.

### Distributed Questions

**Q: "Explain how DDP synchronizes gradients."**
They're testing: Do you understand the communication pattern? Answer: After each backward pass, DDP performs an all-reduce on the gradients using the ring algorithm. Each GPU sends/receives gradient chunks to/from its neighbors. After 2(P-1) steps, every GPU has the exact same averaged gradients.

**Q: "What happens if one GPU has more data than another in DDP?"**
They're testing: Do you know about hangs? Answer: The GPU with more data does an extra forward+backward, which triggers a gradient all-reduce. But the other GPUs aren't participating because they've finished the epoch. Deadlock. Fix: use drop_last=True or pad the last batch.

**Q: "How would you train a 7B parameter model on 8 A100-80GB GPUs?"**
They're testing: Can you do the math? Answer:
- 7B params × 4 bytes = 28GB model weights
- AdamW: 2 momentum states × 28GB = 56GB optimizer state
- Total per GPU with DDP: 84GB. Doesn't fit on 80GB even before activations.
- Solution: FSDP shards across 8 GPUs → ~10.5GB per GPU for model+optimizer. Plenty of room for activations and batch data.
- Add bfloat16 mixed precision to halve activation memory.
- Add activation checkpointing if batch size is still too small.

**Q: "Why use NCCL backend?"**
They're testing: Do you know the alternatives? Answer: NCCL (NVIDIA Collective Communications Library) is optimized for GPU-to-GPU communication over NVLink and InfiniBand. Gloo is the CPU alternative. MPI is available but rarely used in PyTorch. For GPU training, NCCL is always the right choice.

---

### Download

A quick-reference PDF covering the custom training loop, checkpointing, DDP, and a reusable TrainingEngine class:

<a href="/static/pytorch_guide.pdf" download>pytorch_guide.pdf</a>
