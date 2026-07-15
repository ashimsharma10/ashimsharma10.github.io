---
title: 'The Linux & Unix Systems Handbook'
date: '2026-06-21'
tags: ['linux', 'systems', 'kernel', 'networking']
draft: false
summary: 'Hands-on handbook covering the Linux filesystem, shell, processes, storage, networking, and system hardening — built around the core models behind every production problem.'
---

Linux is built from a few core models (files, processes, memory, networking) and almost every production problem is one of those models showing through an abstraction you trusted. This handbook walks those models from the ground up, hands-on, from the filesystem and the shell through to containers, kernel tuning, and system hardening.

The commands are meant to be **run**, not skimmed; **▶** marks something to type yourself. A reasonable way to read it is front to back once, then keep it open as a reference. Each part is self-contained enough to jump to.

#### Set up a sandbox so you can break things safely

```bash
# A throwaway VM is best (cloud/multipass/VirtualBox) — it owns a real kernel,
# init, and network, which the boot/systemd/tuning parts need.
# A container works for most of Parts 1–3:
docker run -it --rm --privileged ubuntu:24.04 bash
#   inside: apt update && apt install -y procps iproute2 lsof curl vim sudo strace tcpdump
```

Throughout, **▶** means _run this yourself_. Reading the command is not the same as watching the output.

> **The rule that prevents most self-inflicted outages:** before editing anything privileged (`sudoers`, `fstab`, `grub`, the firewall, `sshd_config`), keep a second root session open and back the file up. If you sever your own access, you fix it from the open session instead of reinstalling. This recurs throughout — it is the line between a routine change and an incident.

---

## PART 1 — The lay of the land: files, folders, and what they're for

### 1.1 — The core idea: almost everything is a file

In Unix, regular files, directories, devices, kernel state, pipes, and sockets are all reached through the same syscalls (`open`, `read`, `write`, `close`). A process interacts with the outside world through **file descriptors** — small integers naming kernel objects. This is why redirection, `cat /proc/cpuinfo`, and writing tunables to `/sys` all work the same way.

▶ See it:

```bash
ls -l /dev/null /dev/sda /proc/self/status 2>/dev/null   # a device, a disk, kernel state — all "files"
echo hi > /dev/null          # writing to a "file" that discards everything
cat /proc/loadavg            # reading live kernel state as if it were a text file
```

Hold onto this: when something seems opaque, ask "is there a file that exposes it?" — there usually is, under `/proc` or `/sys`.

### 1.2 — The directory hierarchy: where things live and why you go there

One tree, rooted at `/`, no drive letters. You don't memorize it — you learn where to _go to fix a given thing_. The organizing logic: split by **static vs. variable** and **essential vs. optional**.

| Path                 | What it holds                                                               | When you go there                                                        |
| -------------------- | --------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| `/etc`               | System configuration (text, host-specific)                                  | change how anything is configured: `sshd_config`, `fstab`, `resolv.conf` |
| `/var`               | Variable data: `/var/log`, caches, spools, `/var/lib` (app state)           | read logs, find a service's on-disk state, locate a disk-filling cache   |
| `/usr`               | The bulk of the OS: `/usr/bin`, `/usr/lib`, `/usr/share`                    | locate installed binaries and libraries                                  |
| `/usr/local`, `/opt` | Software _you_ installed outside the package manager                        | your own/vendor installs, kept clear of distro files                     |
| `/home`, `/root`     | User home dirs; root's home is `/root` (so it works if `/home` won't mount) | user dotfiles, keys, per-user config                                     |
| `/boot`              | Kernel images, initramfs, bootloader config                                 | kernel/boot problems; it can fill with old kernels                       |
| `/dev`               | Device nodes (managed by udev/devtmpfs)                                     | disks (`/dev/sda`), GPUs (`/dev/nvidia0`), terminals (`/dev/pts/*`)      |
| `/proc`              | Virtual FS: per-process and kernel state, generated on read                 | inspect a running process, read/tune kernel knobs (`/proc/sys`)          |
| `/sys`               | Virtual FS modeling devices/drivers and tunables                            | per-device settings, cgroups v2 (`/sys/fs/cgroup`), I/O scheduler        |
| `/run`               | Volatile runtime state since boot (PID files, sockets); a tmpfs             | find a daemon's socket/PID file                                          |
| `/tmp`, `/dev/shm`   | Scratch; often RAM-backed and cleared on boot                               | temp files; `/dev/shm` is shared memory (matters for multi-process apps) |
| `/mnt`, `/media`     | Mount points (manual / removable)                                           | where you attach extra volumes                                           |

<LinuxFSHierarchy />

As a tree, with the deeper paths you actually reach for in practice:

```text
/
├── etc/                      CONFIG — host-specific, text, no binaries
│   ├── ssh/sshd_config         SSH server config
│   ├── fstab                   what mounts at boot   (Part 4)
│   ├── sudoers, sudoers.d/      who can sudo — edit with visudo ONLY (Part 3.5)
│   ├── systemd/system/          your custom service units (Part 5)
│   ├── sysctl.d/                persistent kernel tunables (Part 10)
│   ├── nsswitch.conf, hosts,
│   │   resolv.conf             name resolution order, static hosts, DNS (Part 6)
│   ├── ssl/certs/               system CA trust store (Part 14)
│   ├── netplan/ | NetworkManager/  host network config (Part 13)
│   ├── pam.d/                   authentication stack (Part 3.5)
│   └── cron.d/, logrotate.d/    scheduled jobs, log rotation (Parts 5,15)
│
├── var/                      VARIABLE DATA — grows; watch it fill disks
│   ├── log/                     logs (journald + app files)  (Part 5)
│   ├── lib/                     persistent service state (dbs, docker overlay) (Part 12)
│   ├── cache/, spool/           caches and queues
│   └── run -> /run             (symlink on modern systems)
│
├── usr/                      THE INSTALLED OS — static, read-mostly
│   ├── bin/, sbin/              system + admin binaries  (/bin,/sbin link here)
│   ├── lib/, lib64/             shared libraries (.so)   (Part 2.5)
│   ├── local/                   software YOU built/installed (not the package mgr)
│   └── share/                   docs, man pages, arch-independent data
│
├── opt/                      self-contained third-party / vendor packages
├── srv/                      data this host serves (web, ftp)
│
├── home/<user>/              user homes — dotfiles, ~/.ssh/ keys, configs
├── root/                     root's home (separate so it works if /home won't mount)
│
├── boot/                     kernel images, initramfs, GRUB config  (Part 5)
│   └── grub/grub.cfg            GENERATED — never hand-edit
│
├── dev/                      DEVICE NODES (kernel/udev-managed)
│   ├── sda, nvme0n1             block devices (disks)    (Part 4)
│   ├── nvidia0, nvidiactl       GPUs
│   ├── null, zero, random       pseudo-devices
│   ├── pts/                     pseudoterminals (your shells)  (Part 2.2)
│   └── shm/                     POSIX shared memory (RAM)      (Part 3.6)
│
├── proc/                     VIRTUAL — process + kernel state, made on read
│   ├── <pid>/fd/, status,
│   │   maps, limits, environ    per-process X-ray        (Part 3.3)
│   ├── sys/                     kernel tunables (= sysctl) (Part 10)
│   ├── meminfo, loadavg, stat   live system metrics       (Part 13)
│   ├── mounts, net/             mount table, socket tables
│   └── pressure/{cpu,io,memory} PSI saturation signals    (Part 13.1)
│
├── sys/                      VIRTUAL — device/driver model + tunables
│   ├── fs/cgroup/               cgroups v2: resource limits (Part 7.2)
│   ├── block/<dev>/queue/       I/O scheduler, queue depth  (Part 4.5)
│   └── class/net/<if>/          per-interface settings/stats
│
├── run/                      VOLATILE runtime state since boot (tmpfs)
│   └── *.sock, *.pid            daemon sockets and PID files
│
├── tmp/                      scratch (often tmpfs; cleared on boot)
└── mnt/, media/              mount points for extra / removable volumes
```

Two facts that trip people up: `/proc` and `/sys` are **not files on disk** — reading them runs kernel code that formats current state, which is why their sizes show as zero. And on modern distros `/bin`, `/sbin`, `/lib` are just symlinks into `/usr` (the "usr-merge"); conceptually there's one place for binaries now.

▶ See the shape:

```bash
ls /                  # the top level
df -h                 # which filesystems are mounted where, and how full
findmnt | head        # the mount tree drawn out
```

A concrete payoff: the default `/dev/shm` (RAM-backed shared memory) is tiny inside containers, which is why multi-worker data pipelines and some multi-process apps crash with cryptic errors there — `--shm-size` is the fix. Knowing the directory exists turns a baffling failure into a one-flag change.

### 1.3 — File types: there are exactly seven

The first character of `ls -l` is the type. Knowing all seven removes a lot of mystery.

▶ Make and inspect each kind you can:

```bash
ls -l                # leading char: - d l c b p s
mkfifo myfifo        # p : a named pipe (FIFO)
ln -s /etc/hostname mylink   # l : a symbolic link
ls -l /dev/null /dev/sda /run/*.sock 2>/dev/null   # c (char dev), b (block dev), s (socket)
```

- `-` **regular file** — data: text, binaries, images.
- `d` **directory** — a file whose contents map names → inode numbers.
- `l` **symlink** — a tiny file holding a path; resolves at access time, can dangle, can cross filesystems.
- `c` **character device** — unbuffered byte stream (terminals, `/dev/null`).
- `b` **block device** — block-addressable, buffered through the kernel (disks); filesystems sit on these.
- `p` **named pipe (FIFO)** — a pipe with a filesystem name, for unrelated processes to stream through.
- `s` **socket** — an IPC endpoint (e.g. `/run/docker.sock`, a database's local socket).

`file <path>` inspects _content_ (magic bytes) and will tell you a `-` file is actually an ELF binary, a PNG, or gzip data — useful when extensions lie.

### 1.4 — Inodes and links: the name is not the file

The key filesystem idea: **a file is an inode** (metadata + pointers to data blocks). The _name_ lives in a directory as an entry pointing at an inode number. Consequences fall out immediately.

▶ See it:

```bash
echo data > a.txt
ln a.txt b.txt          # HARD link: a second name for the SAME inode
ls -li a.txt b.txt      # identical inode number, link count 2
rm a.txt                # removes one NAME; data survives (b.txt still points to the inode)
ls -li b.txt            # link count now 1; data intact
```

Because the data is the inode, not the name: `mv` within a filesystem is nearly free (rewrite a directory entry), and **deleting a file a process still has open frees no space** until that process closes the descriptor — the name is gone but the inode lives while its link count _or_ open-FD count is nonzero. That last point is a recurring production puzzle ("I deleted the huge logs but the disk is still full"); we exploit `/proc/<pid>/fd` to recover from it later.

Running **out of inodes** is a real outage distinct from running out of space: millions of tiny files (caches, checkpoint shards, mail) exhaust the inode table while blocks remain free. `df -h` shows blocks; `df -i` shows inodes. Check both.

### 1.5 — Permissions, ownership, and special bits

▶ The executable bit and reading a mode:

```bash
printf '#!/usr/bin/env bash\necho hi\n' > s.sh
./s.sh                  # Permission denied — no execute bit
chmod +x s.sh; ./s.sh   # now runs
ls -l s.sh; stat s.sh   # read the mode in symbolic and octal
```

Read `-rwxr-xr-x` as type + three triplets (**owner / group / other**), each `r`(4) `w`(2) `x`(1). The octal form is just the sums: `644`=rw-r--r--, `755`=rwxr-xr-x, `600`=rw------- (use this for private keys; SSH _refuses_ loose key perms). A directory needs **x** to be entered (`cd`) and **r** to be listed (`ls`) — a `644` directory looks fine but you can't `cd` into it.

▶ Ownership — checked against the file's owner and group:

```bash
sudo chown user:group file
sudo chown -R www-data:www-data /var/www   # whole tree (double-check the path — -R on / is catastrophic)
```

▶ The special bits — setuid, setgid, sticky:

```bash
ls -l /usr/bin/passwd     # -rwsr-xr-x : the 's' (setuid) runs it as its OWNER (root) so users can edit /etc/shadow
ls -ld /tmp               # drwxrwxrwt : the 't' (sticky) lets users delete only their OWN files in a shared dir
chmod g+s shareddir       # setgid on a dir: new files inherit the dir's group (keeps shared projects consistent)
find / -perm -4000 -type f 2>/dev/null   # audit ALL setuid-root binaries — a prime privilege-escalation surface
```

`umask` controls the default permissions new files are born with (`022` → 644 files / 755 dirs; tighten to `027` on sensitive hosts). When the owner/group/other model is too coarse ("alice and bob and the audit group, each different"), use **ACLs** (`setfacl -m u:bob:rwx file`, `getfacl file`); a trailing `+` on `ls -l` perms means an ACL is present.

Ownership and mode mistakes are the most common "permission denied" on files that "look fine" — your first two checks are `id` (am I in the right group?) and `ls -l`/`stat` (is the file what I think it is?).

---

## PART 2 — The shell and the terminal

People conflate three things: the **terminal** (the device/window), the **shell** (the program that reads and runs your commands), and the **TTY** (the kernel layer between them). Untangling them explains job control, why your background job dies when you log out, and why `tmux` exists.

### 2.1 — What the shell actually is

The shell is a read-evaluate loop: read a line, expand it, run it, repeat. Before running anything it performs **expansion** in a fixed order (brace, tilde, variable, command substitution, arithmetic, word-splitting, then globbing) and _then_ executes. Most shell surprises are expansion happening when you didn't expect it.

▶ Watch expansion, and learn what a command even is:

```bash
echo {a,b,c}.txt          # brace expansion -> a.txt b.txt c.txt
echo $HOME ~              # variable + tilde
echo "files: $(ls | wc -l)"   # command substitution
type cd; type ls; type ll 2>/dev/null   # builtin? external binary? alias? function?
command -v python3        # the binary that would actually run
```

`cd` is a **builtin** (it must be — a child process couldn't change the parent shell's directory). `ls` is an **external** binary found via `$PATH`. Knowing which is which explains why some things can't be backgrounded or run over `ssh host cmd` the way you expect.

**Login vs non-login, interactive vs non-interactive** decides which startup files run — and this is the source of "works in my terminal, fails in cron/ssh/systemd." Interactive login shells read `~/.bash_profile`/`~/.profile`; interactive non-login read `~/.bashrc`; **non-interactive shells (scripts, cron, systemd) read almost nothing**. So your `PATH` tweak in `~/.bashrc` simply does not exist for a cron job. Set what non-interactive contexts need explicitly.

### 2.2 — Terminals, TTYs, and PTYs

"TTY" is short for teletypewriter, the historical hardware. Today the **tty layer** is a kernel subsystem sitting between a program's stdin/stdout and whatever is on the other end: a real serial console, the virtual consoles on a physical machine, or (almost always now) a **pseudoterminal** (PTY).

A PTY is a pair: a **master** (held by SSH, xterm, tmux) and a **slave** (`/dev/pts/N`) that programs treat as their terminal. The kernel's **line discipline** sits between them, echoing keys and translating Ctrl-C into SIGINT. Programs that need raw keys (vim, password prompts) switch to **raw mode**.

▶ See your terminal:

```bash
tty                  # which terminal this shell is attached to, e.g. /dev/pts/0
ls -l /dev/pts/      # one slave device per open terminal session
stty -a              # the line-discipline settings: echo, the intr key (^C), erase, etc.
echo $TERM           # what kind of terminal apps think they're talking to
ps -o pid,tty,cmd    # the TTY column links processes to their terminal
```

This matters because the tty is also a **signal delivery mechanism**: Ctrl-C sends SIGINT, Ctrl-Z sends SIGTSTP, Ctrl-\ sends SIGQUIT — to the foreground process group of that terminal. That's the bridge to job control.

### 2.3 — Sessions, process groups, and why background jobs die at logout

When you log in, the shell starts a **session** with a **controlling terminal**. Commands you run become **process groups** within it; one is the **foreground** group (gets your keystrokes and signals), the rest are background. When the terminal goes away (you close SSH), the kernel sends **SIGHUP** ("hangup") to the session — and by default that kills your jobs.

▶ Job control:

```bash
sleep 300 &        # background; shell prints [1] <pid>
jobs               # list jobs in this shell
fg %1              # foreground it
# Ctrl-Z           # suspend (SIGTSTP) -> state 'stopped'
bg %1              # resume in background
```

So to keep work alive past logout you must detach it from the session's SIGHUP:

```bash
nohup long_job.sh &        # ignore SIGHUP, redirect output to nohup.out
disown -h %1               # remove an existing job from the shell's HUP list
setsid long_job.sh         # start in a brand-new session with no controlling terminal
tmux new -s work           # BEST: a persistent session you can detach (Ctrl-b d) and reattach later
tmux attach -t work        # reconnect after your SSH drops — the job never knew you left
```

`tmux`/`screen` exist precisely because of this model: they hold the master side of a PTY on the server, so your shell's controlling terminal survives even when _your_ connection dies. For any long-running remote task (a build, a migration, a training run), start it inside tmux. A dropped SSH connection then costs you nothing.

### 2.4 — Pipes, redirection, and the descriptor model

Every process has three standard descriptors: **stdin (0)**, **stdout (1)**, **stderr (2)**. Pipes and redirection just rewire them — that's the whole mechanism behind the shell's composability.

▶ Wire streams together:

```bash
ls -l /etc | head -5            # | connects stdout of ls to stdin of head
sort f | uniq -c | sort -rn     # the count-and-rank pipeline you'll reuse forever
cmd > out.txt 2> err.txt        # stdout and stderr to separate files
cmd > out.txt 2>&1              # both to one file (order matters: redirect stdout, then point stderr at it)
cmd 2>&1 | tee run.log          # watch live AND save — the deploy/CI habit
diff <(sort a) <(sort b)        # process substitution: feed command output where a filename is expected
```

The fork/exec split (Part 3) is _why_ this works: between forking the child and running the new program, the shell rewires the child's descriptors, so the program writes to "stdout" none the wiser that it's a file or a pipe.

### 2.5 — Environment, PATH, and how a command really runs (dynamic linking)

▶ The environment and lookup:

```bash
echo $PATH                 # colon-separated dirs searched for commands, left to right
export DB_URL=...          # set for this shell AND its children (children inherit the environment)
env | sort | head          # the full inherited environment
printenv PATH
```

When you run a binary, two more things happen that bite people constantly. First, the kernel reads the **shebang** (`#!/usr/bin/env bash`) to pick an interpreter; a missing or wrong shebang gives "exec format error." Second, most binaries are **dynamically linked** — they load shared libraries at runtime via the dynamic linker (`ld.so`), searching a configured path plus `LD_LIBRARY_PATH`.

▶ Inspect what a binary needs:

```bash
ldd /usr/bin/curl          # the shared libraries it requires, and where they resolve
file /usr/bin/curl         # dynamically vs statically linked, architecture
echo $LD_LIBRARY_PATH      # extra library search dirs
ldconfig -p | grep ssl     # the system's known shared libraries
```

"`error while loading shared libraries: libfoo.so.7`" means the library is missing, not on the search path, or the wrong ABI version. This is the root cause of most "works on my machine" failures, especially with native libs (CUDA, MKL, MPI). `ldd` is the first diagnostic. Matching library versions between build and runtime is the cure, and much of why containers exist.

▶ Make environment and PATH changes stick — but only where they apply:

```bash
echo 'export PATH="$HOME/.local/bin:$PATH"' >> ~/.bashrc && source ~/.bashrc
# For a service, set it in the systemd unit (Environment=/EnvironmentFile=), NOT in your dotfiles,
# because the service never reads your interactive shell config.
```

---

## PART 3 — Processes, memory, identity, and the kernel boundary

### 3.1 — How processes are born: fork, exec, wait

Linux creates processes with a deliberate two-step. **`fork()`** clones the current process (copy-on-write, so it's cheap); both sides return from the same call, distinguished by the return value. **`exec()`** then replaces the child's image with a new program, keeping the PID. The parent later **`wait()`s** to collect the child's exit status.

This is why launching `ls` is "shell forks a copy of itself, the copy execs `/usr/bin/ls`," and why redirection is possible (the child rewires its descriptors between fork and exec). A finished process becomes a **zombie** until its parent reaps it; if a parent dies first, children are reparented to PID 1 (systemd), which reaps them. Persistent zombies mean a buggy parent that never `wait()`s — they consume PIDs, not memory.

### 3.2 — Process states, signals, and the one that defies kill -9

▶ Watch and control:

```bash
ps aux --sort=-%cpu | head      # top CPU consumers, with state in column 8
top                              # live; q to quit
pgrep -fl python                 # PIDs whose command matches
kill <pid>                       # SIGTERM(15): "shut down cleanly" — ALWAYS try this first
kill -HUP <pid>                  # many daemons reload config on SIGHUP
kill -9 <pid>                    # SIGKILL: unconditional, no cleanup — last resort
ps aux | awk '$8 ~ /D/'          # find processes stuck in UNINTERRUPTIBLE sleep
```

The states: **R** running, **S** interruptible sleep, **D** uninterruptible sleep, **T** stopped, **Z** zombie. The critical one is **D**: blocked in the kernel on I/O (usually a wedged disk or hung NFS). **No signal reaches it; `kill -9` will not work.** Fix the underlying I/O, not the signal.

Signals are asynchronous notifications. The two a process can never catch or block are **SIGKILL (9)** and **SIGSTOP (19)** — by design, so the system always retains ultimate control. Everything else (SIGTERM, SIGHUP, SIGINT, SIGUSR1/2…) can be handled, which is why well-behaved daemons trap SIGTERM to drain connections and SIGHUP to reload. Reach for SIGTERM first so the process flushes buffers and releases locks; escalate only if it's ignored.

### 3.3 — /proc: a live X-ray of any process

Everything about a running process is a file under `/proc/<pid>`. This is where `ps`, `top`, and `lsof` get their data, and where you go when those aren't enough.

▶ Try it:

```bash
sleep 600 & PID=$!
ls -l /proc/$PID/fd          # every open descriptor: files, sockets, pipes
cat /proc/$PID/cmdline | tr '\0' ' '; echo     # the exact launch command
cat /proc/$PID/environ | tr '\0' '\n' | head   # the environment it inherited
cat /proc/$PID/status        # state, memory (VmRSS), threads, UID/GID
cat /proc/$PID/limits        # its effective ulimits
```

The high-value trick — recover a deleted-but-open file (space the kernel hasn't freed because a process still holds the descriptor):

```bash
sudo lsof +L1                          # open files whose link count is 0 (deleted but held)
sudo cp /proc/<pid>/fd/<N> recovered   # read the data back through the descriptor
sudo truncate -s 0 /proc/<pid>/fd/<N>  # or reclaim the space live without restarting
```

### 3.4 — The memory model: virtual memory, RSS, and the page cache

Each process sees its own **virtual address space**; the kernel maps pages of it to physical RAM on demand. Three numbers you must read correctly: **VSZ** (virtual size, the address space reserved, often huge and mostly meaningless), **RSS** (resident set, physical RAM actually used, the number that matters), and **shared** pages (libraries mapped into many processes, which is why summing RSS over-counts).

The concept that confuses the most people: the **page cache**. Linux uses otherwise-free RAM to cache file contents, so "free memory" looks alarmingly low — but that cache is instantly reclaimable and is a feature, not a leak.

▶ Read memory correctly:

```bash
free -h                  # look at "available", NOT "free": available counts reclaimable cache
cat /proc/meminfo | grep -E 'MemAvailable|Cached|Dirty|Writeback'
ps -o pid,rss,vsz,cmd --sort=-rss | head   # real (rss) vs virtual (vsz)
```

`Dirty` pages are modified but not yet written to disk; the kernel flushes them lazily (durability needs `fsync`, Part 4). When RAM runs out, the **OOM killer** picks a victim by `oom_score` and kills it. Confirm with `dmesg -T | grep -i oom`. The same fires per-cgroup at `memory.max` while the host has free RAM (Part 7).

**Swap** is disk used as overflow RAM; a little is a safety net, but active swapping (`si`/`so` in `vmstat`) destroys latency. Lower `vm.swappiness` on latency-sensitive nodes. For large-memory, throughput-heavy workloads, **huge pages** (2 MiB/1 GiB instead of 4 KiB) cut page-table overhead — relevant to databases and large in-memory models.

### 3.5 — Identity: users, groups, and controlled privilege

▶ Who you are and how to manage users:

```bash
id; groups                        # your UID/GID and group memberships — the basis of every permission check
getent passwd $USER               # your account record (works for LDAP/SSS too, unlike grepping /etc/passwd)
sudo adduser alice                # create a user (Debian/Ubuntu; useradd -m elsewhere)
sudo usermod -aG docker alice     # ADD to a group — the -a is vital; without it you REPLACE all groups
```

Accounts live in `/etc/passwd` (UID, shell, home — world-readable) and password hashes in `/etc/shadow` (root-only). Authentication itself is pluggable via **PAM** (`/etc/pam.d/`), which is how things like MFA, account lockout, and LDAP get layered in without changing every program.

▶ Privilege escalation done safely with sudo:

```bash
sudo command                      # run one command as root, audited, using YOUR password
sudo -u postgres psql             # run as a specific service user
sudo -i                           # interactive root login shell (root's full environment)
```

**Never hand-edit `/etc/sudoers`** — a syntax error there can lock _everyone_ out of sudo, and you need sudo to fix it. Use `visudo`, which validates before saving, and prefer drop-in files:

```bash
sudo visudo -f /etc/sudoers.d/deploy
#   contents — grant only what's needed, scoped to exact commands:
#   deploy ALL=(root) NOPASSWD: /usr/bin/systemctl restart myapp
sudo visudo -cf /etc/sudoers.d/deploy   # syntax-check a drop-in
```

Scope `NOPASSWD` to specific commands; `NOPASSWD: ALL` for a service account is effectively frictionless root for anyone who compromises it. If you do break sudoers, the boot recovery shell (Part 5) is the way back.

### 3.6 — How processes talk: IPC

Cooperating processes share data through several mechanisms, each with a sweet spot:

- **Pipes / named pipes (FIFOs)** — one-way byte streams; the backbone of shell pipelines.
- **Unix domain sockets** — bidirectional local IPC, faster than TCP and permission-controlled by filesystem mode. This is what `/run/docker.sock`, databases, and most local service APIs use. Treat their file permissions as an access-control boundary.
- **Shared memory** (`/dev/shm`, POSIX/SysV shm) — the fastest way to share bulk data, since processes map the same physical pages with no copy. Heavily used by multi-process data pipelines and any framework that hands large buffers between workers.
- **Signals** — tiny asynchronous notifications (Section 3.2).
- **eventfd/futex/etc.** — low-level primitives that back higher-level synchronization.

▶ See local sockets in use:

```bash
ss -xlp                  # listening UNIX domain sockets and the processes behind them
ls -l /run/*.sock /var/run/*.sock 2>/dev/null
ipcs                     # System V shared memory / semaphores / message queues in use
```

### 3.7 — The kernel/userspace boundary: syscalls

Your code can't touch hardware, memory maps, or other processes directly; it asks the kernel through **system calls** (`openat`, `read`, `write`, `mmap`, `clone`, `connect`…). Everything a program does that leaves its own address space is a syscall, which is why tracing syscalls (`strace`, eBPF) reveals what a program is _actually_ doing, independent of its source, and why the syscall surface is also the security boundary you can lock down with seccomp (Part 7).

---

## PART 4 — Storage and filesystems

### 4.1 — The VFS, journaling, and durability

The **Virtual File System** is the kernel layer that lets one set of syscalls work across every filesystem type (ext4, xfs, btrfs, zfs, tmpfs, nfs). Each filesystem implements the same operations; the VFS dispatches. On-disk, modern filesystems use **extents** (contiguous `start+length` ranges) instead of per-block pointer chains, which is why large sequential files are fast.

**Journaling** records intent to a log before metadata changes, so crash recovery replays or discards incomplete operations instead of a full fsck. But journaling protects filesystem _consistency_, not your _data_. Writes land in the page cache and flush lazily. Durability requires **`fsync()`**.

▶ See the landscape:

```bash
lsblk -f                 # block devices, filesystems, UUIDs, mountpoints — the storage map
findmnt                  # the full mount tree with options
mount | grep -w ext4     # what's mounted how
cat /proc/mounts         # the kernel's authoritative mount list
```

Quick filesystem orientation: **ext4** is the reliable default; **xfs** excels at large files and parallelism (grows online, can't shrink); **btrfs/zfs** add snapshots, checksums, and send/receive (zfs is the integrity gold standard but memory-hungry and out-of-tree); **tmpfs** lives in RAM.

### 4.2 — Mounts, bind mounts, and fstab without bricking boot

▶ Mount now, then make it permanent safely:

```bash
sudo mount /dev/sdb1 /data            # one-time; gone after reboot
sudo blkid /dev/sdb1                  # get the UUID (device names like sdb reorder between boots)
echo 'UUID=xxxx /data ext4 defaults,nofail 0 2' | sudo tee -a /etc/fstab
sudo mount -a                         # TEST NOW — must succeed silently before you ever reboot
```

**`nofail` is not optional on non-root mounts:** without it, a missing or failed disk at boot drops the machine into emergency mode and it never comes up — over SSH the box simply vanishes. And always run `mount -a` after editing fstab; if it errors now, it will fail to boot later. **Bind mounts** graft one subtree elsewhere (`mount --bind /src /dst`) and are the basis of how containers assemble a root filesystem from pieces.

### 4.3 — LVM and growing storage online

LVM decouples filesystems from physical disks so you can grow storage with no downtime — the main reason to use it over raw partitions.

▶ Grow a volume after enlarging the underlying disk:

```bash
sudo pvresize /dev/sdb1                       # LVM, the physical volume grew
sudo lvextend -l +100%FREE /dev/vg0/data      # extend the logical volume into free space
sudo resize2fs /dev/vg0/data                  # grow ext4 to fill it (xfs: xfs_growfs /data)
```

For redundancy and throughput, **RAID** (via `mdadm` or hardware/zfs) combines disks: mirroring (RAID1) for safety, striping (RAID0) for speed, RAID10/RAIDZ for both — relevant whenever a single disk can't hold or feed your data fast enough.

### 4.4 — When the disk fills (and the two ways it does)

▶ Diagnose:

```bash
df -h                              # blocks: which filesystem is full
df -i                              # inodes: full here even when df -h shows space (tiny-file explosion)
sudo du -xh / | sort -h | tail -20 # biggest consumers, staying on one filesystem
sudo lsof +L1                      # deleted-but-open files silently holding space (Section 3.3)
ncdu /                             # interactive explorer (install it)
```

A full filesystem fails writes with `No space left on device` whether you're out of blocks or inodes — so always check both. Mid-write fullness corrupts in-progress files (checkpoints, databases), so monitor `df` and keep large, churning data (datasets, logs, checkpoints) on separate volumes from `/`.

### 4.5 — I/O scheduling and the storage stack

Block I/O passes through the page cache and an **I/O scheduler** before reaching the device. The scheduler matters for mixed workloads on shared storage:

```bash
cat /sys/block/sda/queue/scheduler        # e.g. [mq-deadline] none kyber bfq
echo none | sudo tee /sys/block/nvme0n1/queue/scheduler   # NVMe is fast enough to often want 'none'
iostat -xz 1 5                            # per-device: %util, await — is the disk the bottleneck?
```

`mq-deadline`/`bfq` give fairness and latency bounds on spinning or contended disks; `none` lets very fast NVMe go full speed. High `%util` with high `await` in `iostat` is the unambiguous signal that storage, not CPU, is your bottleneck.

---

## PART 5 — Booting and init

### 5.1 — The boot chain

Power-on: **firmware (UEFI/BIOS)** → **GRUB** → loads **kernel + initramfs** (tiny root with drivers to find the real root) → kernel mounts real root, starts **PID 1 (systemd)** → systemd brings the system to a target by starting dependencies in parallel. Knowing this chain localizes boot failures to the right layer.

### 5.2 — systemd: units, targets, dependencies

systemd models the system as **units** (services, sockets, mounts, timers, targets) with explicit dependencies, started in parallel where possible.

▶ Operate services:

```bash
systemctl status sshd                  # running? recent logs? PID? memory? cgroup?
sudo systemctl restart nginx
sudo systemctl reload nginx            # re-read config without dropping connections (if supported)
sudo systemctl enable --now myapp      # start now AND on every boot (two independent things)
systemctl list-units --failed          # everything currently broken — a great health glance
systemctl list-dependencies myapp      # what it needs / what needs it
```

`start` (running now) and `enable` (running at boot) are independent — forgetting `enable` is why a service disappears after reboot.

▶ Define your own service. A unit file declares _what_ to run, _how_ to run it, and _what to do when it fails_. The three sections: `[Unit]` = dependencies and ordering, `[Service]` = runtime model (user, command, restart policy, limits, sandboxing), `[Install]` = which target pulls it in at boot.

Every directive maps to a kernel primitive: `User=` sets UID, `MemoryMax=` writes a cgroup limit, `NoNewPrivileges=` sets a process flag, `ProtectSystem=` uses mount namespaces.

`/etc/systemd/system/myapp.service`:

```ini
[Unit]
Description=My App
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
User=myapp
ExecStart=/opt/myapp/venv/bin/python server.py --port 8080
Restart=on-failure
RestartSec=5
LimitNOFILE=65536           # raise the open-file ceiling (Part 10)
NoNewPrivileges=true        # cheap, real hardening
ProtectSystem=strict
ReadWritePaths=/opt/myapp/data
MemoryMax=4G                # resource caps — these are cgroups (Part 7)
CPUQuota=200%               # = 2 full cores

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl daemon-reload     # MUST run after creating/editing any unit
sudo systemctl enable --now myapp
```

This turns any binary into a managed, auto-restarting, log-captured, resource-limited service — far better than `nohup … &`. Forgetting `daemon-reload` after an edit leaves the old version running.

▶ Schedule work with a timer (more observable than cron — runs log to the journal and show in `list-timers`):

```ini
# myjob.timer
[Timer]
OnCalendar=*-*-* 03:00:00
Persistent=true            # catch up if the machine was off at the scheduled time
[Install]
WantedBy=timers.target
```

```bash
sudo systemctl enable --now myjob.timer
systemctl list-timers
```

### 5.3 — Logs: journalctl

```bash
journalctl -u myapp -f                 # follow a service's logs live
journalctl -u myapp --since "15 min ago"
journalctl -p err -b                   # errors since this boot
journalctl -b -1                       # PREVIOUS boot — first stop after an unexplained reboot
journalctl -k                          # kernel messages (= dmesg)
sudo journalctl --vacuum-time=7d       # trim retention
```

### 5.4 — GRUB and the recovery shell (the ultimate escape hatch)

Eventually you'll break boot — a bad fstab, broken sudoers, a kernel that won't load. **Never hand-edit the generated `grub.cfg`**; edit `/etc/default/grub`, then regenerate.

```bash
sudo vim /etc/default/grub             # GRUB_TIMEOUT, GRUB_CMDLINE_LINUX_DEFAULT="quiet ..."
sudo update-grub                       # Debian/Ubuntu (RHEL: grub2-mkconfig -o /boot/grub2/grub.cfg)
```

Test a kernel parameter for _one_ boot first (reversible): at the GRUB menu press `e`, append it to the `linux` line, Ctrl-X to boot.

▶ The rescue skill — a root shell on a box that won't boot:

```text
GRUB menu -> press e -> on the line starting `linux ...` append:  init=/bin/bash -> Ctrl-X
```

```bash
mount -o remount,rw /        # it boots read-only; make it writable
# ...fix it: visudo / edit /etc/fstab / passwd root...
sync; exec /sbin/init        # or reboot -f
```

This one skill recovers a broken sudoers, a fstab that won't boot, _and_ a forgotten root password (`passwd root` in that shell). Practice it on the sandbox before you need it under pressure.

---

## PART 6 — Networking

### 6.1 — The stack and the packet's path

From the wire up: the **NIC/driver** receives frames; the **link layer** handles MAC addresses and ARP; the **IP layer** handles addressing and routing; the **transport layer** (TCP/UDP) handles ports and, for TCP, connection state and reliability; **sockets** hand bytes to your program. Learn the `iproute2` tools (`ip`, `ss`) and treat the old `net-tools` (`ifconfig`, `netstat`, `route`) as legacy — they're often not even installed.

▶ The host's view:

```bash
ip addr                 # interfaces and their IP addresses
ip route                # routing table — where does traffic for X go?
ip neigh                # ARP/neighbor table (L2 ↔ L3 mappings)
ip -s link              # interface counters: drops and errors live here
```

### 6.2 — Sockets, ports, and the states that cause outages

▶ What's listening and what's connected:

```bash
sudo ss -tlnp                       # TCP, Listening, Numeric, Process — the one to memorize
sudo ss -tnp state established      # live connections
ss -tan state time-wait | wc -l     # how many sockets are in TIME_WAIT
ss -s                               # socket summary by state
```

Two TCP realities cause real, confusing outages at scale:

**TIME_WAIT.** The side that closes a TCP connection first holds the socket in TIME_WAIT (~60s). A client churning short-lived connections can exhaust the **ephemeral port range**, causing "cannot assign requested address" while everything else looks fine. The real fix: **connection pooling and keepalive**. Stopgap: widen `net.ipv4.ip_local_port_range` and enable `tcp_tw_reuse`.

**Accept queue / backlog.** A listening socket has a fixed-depth accept queue (`net.core.somaxconn`, plus the app's `listen()` backlog). Under a connection burst, an overflowing queue **silently drops** incoming connections — the client sees timeouts while the server looks idle. `ss -tln` shows `Recv-Q`/`Send-Q` for listeners; sustained nonzero `Recv-Q` on a listener is the smell.

### 6.3 — Name resolution: more than DNS

A hostname is resolved according to `/etc/nsswitch.conf` (the `hosts:` line), which usually consults `/etc/hosts` _first_, then DNS via `/etc/resolv.conf`. So a stale `/etc/hosts` entry overrides DNS and produces "it resolves to the wrong IP and DNS looks correct" mysteries.

▶ Resolve and test deliberately:

```bash
getent hosts api.internal        # resolution the way the SYSTEM does it (honors nsswitch/hosts)
dig +short api.internal          # DNS specifically (bypasses /etc/hosts)
cat /etc/resolv.conf             # which resolvers, and search domains
```

`getent` vs `dig` disagreeing immediately tells you whether the culprit is `/etc/hosts`/nsswitch or DNS itself.

### 6.4 — Firewalling and NAT: netfilter, iptables, nftables

**netfilter** processes packets at kernel hooks (`PREROUTING`, `INPUT`, `FORWARD`, `OUTPUT`, `POSTROUTING`). **iptables** organizes rules into tables: `filter` (allow/deny), `nat` (SNAT/MASQUERADE, DNAT), `mangle`. **nftables** is the modern replacement and default backend now; you still need to read iptables because container runtimes and older systems use it everywhere.

The unsung component is **conntrack** (connection tracking): netfilter is stateful, so reply traffic is auto-allowed and NAT stays consistent. On busy NAT gateways the conntrack table can fill (`nf_conntrack: table full, dropping packet` in `dmesg`), a genuine outage fixed by raising `net.netfilter.nf_conntrack_max`.

▶ Firewall basics — allow SSH before you enable anything:

```bash
sudo ufw allow 22/tcp            # ALWAYS first, or you cut your own SSH session
sudo ufw allow 80,443/tcp
sudo ufw enable; sudo ufw status numbered
sudo conntrack -L 2>/dev/null | head   # live tracked connections (where available)
```

### 6.5 — Traffic shaping and impairment with tc

Where netfilter decides _whether_ a packet passes, **`tc`** decides _how and when_ it leaves — bandwidth limits, prioritization, and (for testing) deliberate impairment.

```bash
# inject 100ms latency and 1% loss to test how your app behaves on a bad network:
sudo tc qdisc add dev eth0 root netem delay 100ms loss 1%
sudo tc qdisc del dev eth0 root          # remove it
```

`netem` is invaluable for validating timeout/retry behavior before a real network does it to you in production.

### 6.6 — SSH: keys, config, tunnels

```bash
ssh-keygen -t ed25519 -C "you@host"      # generate (private key stays put, mode 600)
ssh-copy-id user@server                   # install the PUBLIC key on the server
# ~/.ssh/config:  Host gpu1 / HostName ... / User ... / IdentityFile ...
ssh -L 8888:localhost:8888 gpu1           # tunnel a remote port to your localhost (Jupyter, TensorBoard, a DB UI)
ssh -J bastion user@private-host          # jump through a bastion to reach a private node
```

Harden the server (`/etc/ssh/sshd_config`: `PasswordAuthentication no`, `PermitRootLogin prohibit-password`), then `sshd -t` to validate config and restart — but confirm key login works in a second session first. Tunnels and jump hosts are how you reach private nodes and dashboards without exposing them to the internet.

### 6.7 — Network namespaces: debug a container's network from the host

Each container has its own network namespace — its own interfaces, routes, and ports. You can run the host's tools _inside_ that view without touching the container image:

```bash
PID=$(docker inspect -f '{{.State.Pid}}' <container>)
sudo nsenter --target $PID --net ss -tlnp     # what is the container actually listening on?
sudo nsenter --target $PID --net ip addr      # its interfaces and IPs
sudo nsenter --target $PID --net curl -v http://db:5432   # can IT reach the dependency?
```

This is the best move for "the container can't reach its dependency": you test connectivity from exactly the container's network position using a full toolkit it doesn't contain.

---

## PART 7 — Isolation, resource control, and security

There is no `container` syscall. A container is a userspace convention assembled from three independent kernel mechanisms: **namespaces** (what a process can _see_), **cgroups** (what it can _use_), and **capabilities/seccomp/LSMs** (what it's _allowed to do_). Understanding them separately is the difference between using Docker and debugging it.

### 7.1 — Namespaces: build a tiny container by hand

▶ Create isolated namespaces directly:

```bash
sudo unshare --pid --mount --uts --net --fork --mount-proc bash
#   inside the new shell:
hostname box1            # changing the hostname here doesn't affect the host (UTS namespace)
ps aux                   # you see almost nothing — your own PID namespace; you are PID 1
ip addr                  # an empty network namespace (no interfaces but loopback)
exit
```

The namespaces: **PID** (own process tree), **mount** (own filesystem), **net** (own interfaces/ports), **UTS** (hostname), **IPC**, **user** (UID mapping), **cgroup**, **time**. The security-critical one is **user**: root inside maps to an unprivileged UID outside, so a breakout does not give host root. This is the foundation of rootless containers.

### 7.2 — cgroups v2: stop one workload from taking the box

Control groups limit and account for CPU, memory, and I/O per group of processes. Modern systems use **cgroups v2** — a single unified tree under `/sys/fs/cgroup` that systemd manages (every service is already a cgroup).

▶ Observe and cap:

```bash
systemd-cgtop                     # live CPU/mem/IO per cgroup (top, but for groups)
sudo systemctl set-property myapp.service MemoryMax=4G CPUQuota=200%   # cap a service the easy way
# the raw mechanism, to see what Docker/systemd do for you:
sudo mkdir /sys/fs/cgroup/demo
echo '50000 100000' | sudo tee /sys/fs/cgroup/demo/cpu.max     # 50% of one CPU
echo 256M           | sudo tee /sys/fs/cgroup/demo/memory.max
echo $$             | sudo tee /sys/fs/cgroup/demo/cgroup.procs # put this shell in the group
cat /sys/fs/cgroup/demo/memory.events                          # watch the oom_kill counter
```

This explains a frequent surprise: a container "randomly restarts" with no application error because it hit `memory.max` and the kernel OOM-killed its main process _inside the cgroup_ while the host had free RAM. The proof is in `dmesg` and `memory.events`. Per-workload limits turn "one bad job takes down everything on the node" into "one bad job is throttled or killed in isolation" — essential when several heavy jobs share one machine.

### 7.3 — Capabilities: root sliced into pieces

Traditional Unix is binary (root can do anything; everyone else can't). **Capabilities** split root's power into ~40 grantable pieces.

```bash
getcap /usr/bin/ping                                  # often cap_net_raw — why ping works without sudo
sudo setcap cap_net_bind_service=+ep /opt/app/server  # bind :80 WITHOUT being full root
getpcaps $$                                           # this process's capabilities
```

When something works as host-root but fails as container-root (can't `mount`, can't load a module), a dropped capability (usually `CAP_SYS_ADMIN`) is the first suspect; containers drop most by default.

### 7.4 — Mandatory access control and syscall filtering

Beyond the discretionary owner/group model, the kernel offers stronger confinement:

- **LSMs — SELinux / AppArmor.** Mandatory access control: even root is constrained by policy. SELinux (RHEL) labels every file and process and enforces what may interact; AppArmor (Ubuntu/SUSE) confines per-program by path profiles. The signature symptom is "permissions are 777 and it _still_ says permission denied": the LSM is denying it. Check `ausearch -m avc` / `dmesg` for AVC denials; `getenforce` shows SELinux mode. Don't reflexively disable it; fix the label/profile.
- **seccomp.** Filters which _syscalls_ a process may make. Container runtimes apply a default seccomp profile that blocks dangerous syscalls, shrinking the kernel attack surface. A program that mysteriously fails only inside a container may be hitting a blocked syscall.

Put together: a hardened container is **namespaces** + **cgroups** + **dropped capabilities** + **seccomp** + an **LSM profile** + a **read-only/minimal root fs**. Each layer is independent; you can reason about and debug them one at a time.

---

## PART 8 — How the shell actually works

Most people learn shell commands. What makes you dangerous is understanding the _execution model_: how the shell parses, expands, forks, and wires things together. Once you see that model, you stop memorizing syntax and start composing.

### 8.1 — The execution model: parse, expand, fork, exec

When you type a command, the shell doesn't just "run it." It goes through a fixed pipeline:

1. **Parse** the line into words (respecting quotes and escapes).
2. **Expand** in a strict order: brace expansion, tilde, variables (`$VAR`), command substitution (`$(cmd)`), arithmetic, word-splitting, then glob expansion. Most shell surprises are one of these expansions firing when you didn't expect it (or not firing because you quoted it).
3. **Look up** the command: is it a function, a builtin (`cd`, `export`, `echo`), or an external binary found via `$PATH`?
4. If external: **fork** a child process (COW), **rewire file descriptors** in the child (this is when redirection happens), then **exec** the binary. The new program inherits the rewired FDs and never knows. This fork-then-rewire-then-exec sequence is _why_ redirection and pipes work.

Why it matters: `cd` must be a builtin because a child process can't change the parent's directory. `export` must be a builtin because it modifies the current shell's environment. If you understand which step does what, you can predict behavior instead of guessing.

### 8.2 — File descriptors and the pipe architecture

Every process has a table of file descriptors. FD 0 = stdin, 1 = stdout, 2 = stderr. Pipes and redirection are just the shell rewiring these descriptors between fork and exec.

`cmd1 | cmd2` creates a kernel pipe (a bounded in-memory buffer), connects cmd1's stdout to the write end and cmd2's stdin to the read end. Both processes run _concurrently_. If the pipe buffer fills, the writer blocks until the reader drains it. This is **backpressure** built into the kernel.

`cmd > file` opens `file` for writing and assigns it to FD 1 before exec. `2>&1` duplicates FD 1 onto FD 2 (order matters: redirections are processed left to right). `cmd > out.txt 2>&1` sends both to the file; `cmd 2>&1 > out.txt` sends stderr to wherever stdout _was_ (the terminal), then redirects stdout to the file. Getting this wrong is the most common redirection mistake.

**Process substitution** (`<(cmd)`) creates a named pipe (FIFO) under `/dev/fd/`, runs `cmd` writing to it, and substitutes the path. That's why `diff <(sort a) <(sort b)` works: `diff` receives two filenames that happen to be live streams.

### 8.3 — Subshells, grouping, and exec

Parentheses `( )` run commands in a **subshell** (a forked child). Variable changes, `cd`, and other state modifications inside it are gone when it exits. This is useful for isolation: `(cd /tmp && tar xf archive.tar)` leaves the parent's cwd unchanged.

Braces `{ }` run commands in the **current** shell. State changes persist. `{ echo header; cat data.csv; } > combined.csv` redirects the group's combined output.

`exec` without a command **replaces file descriptors** in the current shell. `exec > /var/log/myscript.log 2>&1` at the top of a script redirects all subsequent output to a log. `exec` with a command replaces the shell process entirely (no fork, no return).

### 8.4 — How scripts fail (and how to prevent it)

Scripts fail silently by default. A failing command returns a nonzero exit code, the shell ignores it, and the next line runs against broken state. The safety preamble addresses this:

```bash
#!/usr/bin/env bash
set -euo pipefail
```

What each does and why it exists:

- **`set -e`**: exit immediately on any nonzero return. Without it, `cd /nonexistent; rm -rf *` runs the `rm` in the wrong directory. Caveat: commands in `if`/`while` conditions and `||` chains are exempt, so `-e` is a safety net, not a guarantee.
- **`set -u`**: error on unset variables. This is what prevents the catastrophic `rm -rf "$PREFIX/"` where an empty `$PREFIX` expands to `rm -rf /`.
- **`set -o pipefail`**: a pipeline's exit code is the _first_ failure, not the last command. Without it, `curl ... | tar x` "succeeds" even when the download fails.

**Quoting** is the other half: `"$var"` prevents word-splitting and glob expansion. Unquoted `$var` is the #1 source of bugs with filenames containing spaces or `*`.

**`trap` ties cleanup to the process lifecycle.** `trap 'rm -rf "$tmp"' EXIT` runs on any exit (success, error, signal). This is the correct pattern for temp files, lock files, and anything that must be cleaned up regardless of how the script ends. `flock` prevents overlapping runs (cron firing twice, a deploy running concurrently with itself):

```bash
exec 200>/var/run/myjob.lock
flock -n 200 || { echo "already running"; exit 1; }
```

### 8.5 — When to stop using the shell

The shell is excellent glue: orchestrating programs, simple file work, CI steps. It becomes a liability when you need data structures, error handling with nuance, JSON parsing beyond one `jq` call, or concurrency. A 300-line bash script with nested arrays is a rewrite waiting to happen. Knowing when to switch to Python or Go is the skill.

---

## PART 9 — Security model and system hardening

Security is not a checklist of tools to install. It is a set of principles applied at every layer. Understanding the model tells you _what_ to harden and _why_; the tools are just the implementation.

### 9.1 — The layered defense model

An attacker must cross multiple boundaries to do damage. Each layer exists so that a failure at one doesn't mean total compromise:

**Network perimeter** (firewall, security groups) > **Host access** (SSH keys, no passwords) > **Privilege separation** (least-privilege users, sudo scoping) > **Process confinement** (capabilities, seccomp, LSMs) > **Data protection** (encryption at rest, encryption in transit)

A default-deny firewall stops most noise. Key-only SSH eliminates credential stuffing. Running services as non-root with minimal capabilities limits what a compromised process can touch. Encryption protects data even if the disk is stolen.

### 9.2 — Reducing the attack surface

Every listening port is an entry point. Every installed package is code that could have vulnerabilities. Every running service is a process that could be exploited.

```bash
sudo ss -tlnp                        # what's listening? anything unexpected?
systemctl list-units --type=service --state=running   # what's running?
sudo apt list --installed | wc -l    # how much is installed?
```

Disable services you don't need. Uninstall packages you don't use. Don't run anything as root that doesn't require root. The smallest possible surface is the most defensible.

### 9.3 — Authentication: keys over passwords, always

Password authentication is brute-forceable. Key authentication is not (practically). The SSH hardening isn't about memorizing config directives; it's about removing the password path entirely:

```bash
ssh-keygen -t ed25519                 # generate once
ssh-copy-id user@server               # install the public key
```

Then `/etc/ssh/sshd_config`: set `PasswordAuthentication no`, `PermitRootLogin prohibit-password`, `MaxAuthTries 3`. Validate with `sshd -t` before restarting, and test in a second session before closing the first. `fail2ban` rate-limits brute force attempts against any remaining attack surface.

### 9.4 — Privilege: least privilege as a design principle

The question isn't "does this work as root?" but "what is the minimum privilege this needs?"

- Services run as dedicated non-root users with only the filesystem access they need.
- `sudo` rules scope to exact commands: `deploy ALL=(root) NOPASSWD: /usr/bin/systemctl restart myapp` rather than blanket `NOPASSWD: ALL`.
- Capabilities grant specific powers without full root: `cap_net_bind_service` to bind port 80.
- systemd's `ProtectSystem=strict`, `NoNewPrivileges=true`, and `ReadWritePaths=` sandbox a service at the unit level.

Each of these limits blast radius. A compromised web server that runs as `www-data` with `ProtectSystem=strict` can't read `/etc/shadow` or install a rootkit, even if the application has an RCE vulnerability.

### 9.5 — Data protection: encryption at rest

Anyone with physical access or a stolen cloud snapshot can read an unencrypted disk. **LUKS** wraps the block device:

```bash
sudo cryptsetup luksFormat /dev/sdb1           # encrypt (destructive)
sudo cryptsetup open /dev/sdb1 secure_vol      # unlock -> /dev/mapper/secure_vol
sudo mkfs.ext4 /dev/mapper/secure_vol          # filesystem on top
```

For boot-time unlock, add to `/etc/crypttab`. For cloud VMs, use the provider's KMS-backed encryption. The principle: data at rest should be unreadable without the key, regardless of who has the disk.

### 9.6 — Observability: you can't secure what you can't see

Audit trails answer "who did what, when" after an incident.

```bash
sudo auditctl -w /etc/passwd -p wa -k passwd_changes    # watch a critical file
sudo ausearch -k passwd_changes                          # query the trail
```

`auditd` records kernel-level events (file access, exec, permission changes). The journal (`journalctl`) captures service logs. Together with centralized log shipping and alerting (Prometheus + node_exporter for metrics, a log aggregator for events), they form the observability layer that lets you detect anomalies and reconstruct incidents.

### 9.7 — Keeping it maintained

Security is ongoing, not a one-time setup:

- **Automatic security updates** (`unattended-upgrades` or `dnf-automatic`) patch known vulnerabilities without waiting for a human. Unpatched CVEs are the #1 compromise vector.
- **Monitor for drift**: are new ports open? new users created? unexpected processes running? Periodic scans (`ss -tlnp`, `systemctl list-units --failed`, `last -10`) catch changes.
- **Reboot when the kernel updates**: `ls /var/run/reboot-required 2>/dev/null` tells you.

## PART 10 — Kernel tuning and modules

### 10.1 — Modules: extend a running kernel

The kernel is modular: drivers and features load and unload at runtime as `.ko` modules, so one generic kernel supports vast hardware without bloating memory.

```bash
lsmod                            # loaded modules and their use counts
modinfo nvidia                   # a module's parameters, version, dependencies
sudo modprobe <mod>              # load a module AND its dependencies (modprobe -r to unload)
# persist options/blacklists in /etc/modprobe.d/ (e.g. blacklist a conflicting driver)
```

A module runs in kernel space with full privilege — a bad one can panic the box, which is the trade for its performance and access. Vendor/out-of-tree modules (often built via **DKMS** so they rebuild on kernel upgrades) are common for accelerators and specialized NICs.

### 10.2 — sysctl: tune the live kernel

Hundreds of tunables live under `/proc/sys`, surfaced by `sysctl`. Defaults are conservative; loaded servers need a few raised.

```bash
sudo sysctl -w net.core.somaxconn=4096        # for now (lost on reboot)
echo 'net.core.somaxconn = 4096' | sudo tee /etc/sysctl.d/99-tuning.conf   # persist
sudo sysctl --system                          # apply drop-ins
```

| Tunable                                        | Why it matters                                                                  |
| ---------------------------------------------- | ------------------------------------------------------------------------------- |
| `net.ipv4.ip_forward=1`                        | required to route between interfaces — container runtimes set it automatically  |
| `net.core.somaxconn`, `tcp_max_syn_backlog`    | accept-queue depth; too low silently drops connections under burst              |
| `net.ipv4.ip_local_port_range`, `tcp_tw_reuse` | ephemeral-port exhaustion under high connection churn (Part 6)                  |
| `fs.file-max` + per-process `nofile`           | "Too many open files" under high concurrency is almost always this              |
| `vm.swappiness`                                | lower on latency-sensitive nodes — they hate being swapped out                  |
| `vm.max_map_count`                             | some data/ML runtimes (and Elasticsearch) won't start until raised              |
| `vm.overcommit_memory`                         | how optimistically RAM is granted — matters for Redis, JVMs, large reservations |
| `net.netfilter.nf_conntrack_max`               | NAT gateways drop packets when the tracking table fills                         |

▶ Raise the open-file limit (the classic high-concurrency fix):

```bash
ulimit -n                        # current per-process limit (often a too-low 1024)
# persist via /etc/security/limits.d/ for logins, or LimitNOFILE= in a systemd unit for services
```

The **OOM killer** is the tuning you meet under fire: when memory is exhausted it kills a victim by `oom_score`. "The service vanished with no app error" is frequently this (`dmesg | grep -i oom`); spare a critical process by lowering its `oom_score_adj`, but the real fix is correct memory limits and finding the leak.

---

## PART 11 — CPU scheduling, priority, and NUMA locality

### 11.1 — How the scheduler shares CPUs

The default scheduler (CFS) time-slices runnable threads fairly by weight. You influence it with **niceness** (−20 highest priority to +19 lowest), and for hard cases with **real-time** classes that preempt normal tasks.

▶ Adjust priority and I/O priority:

```bash
nice -n 10 ./batch_job            # start a low-priority background job
renice -n 5 -p <pid>              # change a running process's niceness
ionice -c2 -n7 -p <pid>           # lower its disk-I/O priority (best-effort, lowest)
chrt -f 50 ./latency_sensitive    # SCHED_FIFO real-time (use sparingly; can starve others)
chrt -p <pid>                     # show a process's scheduling class
```

Niceness keeps a heavy batch job from drowning latency-sensitive work on a shared box; `ionice` does the same for disk. Real-time classes are powerful and dangerous — a runaway RT thread can lock out everything else, so reserve them for genuinely time-critical paths.

### 11.2 — CPU affinity: pinning work to cores

```bash
taskset -cp <pid>                 # show which CPUs a process may run on
taskset -c 0-3 ./app              # launch pinned to cores 0–3
nproc; lscpu                      # core/thread count and topology (sockets, cores, caches)
```

Pinning reduces cache-line migration and scheduler jitter for throughput-critical or latency-critical processes, and is how you isolate noisy workloads from each other on a many-core node. Kernel-level isolation (`isolcpus=`, `nohz_full=` boot params) dedicates cores entirely to a workload, away from the general scheduler.

### 11.3 — NUMA: memory has a location

On multi-socket servers, memory is **NUMA** — each CPU socket has local memory that's fast to reach and remote memory (on another socket) that's slower. A thread running on socket 0 hammering memory allocated on socket 1 pays a latency tax that silently caps performance.

▶ See and control locality:

```bash
numactl --hardware                # NUMA nodes, their memory, and inter-node distances
numastat                          # local vs remote memory hits (numa_miss = paying the tax)
numactl --cpunodebind=0 --membind=0 ./app   # pin CPU and memory to node 0 together
```

For large-memory databases and accelerator workloads this is not micro-optimization — getting NUMA placement wrong can halve effective bandwidth. On accelerator nodes the same idea extends to **device topology**: a GPU is attached to a particular socket and PCIe/NVLink path, so you want the feeding process, its memory, and its NIC on the _same_ NUMA node as the GPU.

```bash
nvidia-smi topo -m                # the GPU/CPU/NIC affinity matrix: who is close to whom (NVLink/PCIe/NUMA)
```

Aligning process, host memory, NIC, and GPU on one NUMA node is a standard, high-impact tuning step for data-feeding and multi-GPU communication; the topology matrix tells you the right grouping.

---

## PART 12 — Container and image internals

A container _image_ is a stack of read-only layers; a running _container_ adds one writable layer on top. The mechanism that makes this cheap is a **union filesystem**, **OverlayFS**, which presents several stacked directories as one. Combined with the namespaces, cgroups, and capabilities from Part 7, that's the whole trick.

▶ See the pieces on a host running containers:

```bash
mount | grep overlay              # the overlay mounts: lowerdir (image layers) + upperdir (writes) + merged
ls /var/lib/docker/overlay2/      # (Docker) the layer directories on disk
ctr/runc --help 2>/dev/null       # the low-level OCI runtime that actually creates the namespaces/cgroups
```

**lowerdir** = immutable image layers (shared across containers, which is why images are space-efficient). **upperdir** = this container's writes (COW: modifying a file copies it up). **merged** = the unified view the container sees. When the container is deleted, the upperdir goes with it. Persistent data must live in a **volume** (bind mount or named volume outside the overlay).

**Mount propagation** (`private`/`shared`/`slave`) controls whether mounts in one namespace are visible in another. Misconfigured propagation causes "the volume mount isn't showing up in the container." The practical model: an OCI image is layers + metadata, `runc` sets up namespaces/cgroups around the overlay-mounted root.

---

## PART 13 — Knowing and configuring the host: health internals and networking

### 13.1 — What "load average" really means (and PSI, which is better)

Load average is widely misread. On Linux it counts threads that are **runnable _or_ in uninterruptible (`D`) sleep** — so a load of 8 on a 4-core box might be CPU saturation _or_ a pile of processes blocked on slow I/O. Load alone can't tell you which; you need the resource breakdown.

▶ Read system pressure correctly:

```bash
uptime                            # the three load averages (1/5/15 min trend)
nproc                             # divide load by this for a rough CPU-saturation sense
cat /proc/pressure/cpu            # PSI: % of time tasks were STALLED waiting for CPU
cat /proc/pressure/io             # PSI for I/O — the cleanest "is storage the bottleneck" signal
cat /proc/pressure/memory         # PSI for memory — rising = reclaim thrashing, OOM approaching
```

**Pressure Stall Information** (`/proc/pressure/*`) is the better signal: it reports the fraction of time work was stalled per resource. `some` = at least one task stalled; `full` = all stalled. Watch PSI as a metric and you see saturation before it becomes an outage.

### 13.2 — Extended attributes and the watches that run out

Standard mode bits aren't the whole story. **Extended attributes** (xattrs) store metadata in namespaces that underpin ACLs, file capabilities, and SELinux labels — so when permissions behave inexplicably, xattrs may be why.

```bash
getfattr -d -m - file             # all extended attributes on a file
lsattr file; chattr +i file       # ext/xfs file flags; +i = immutable (even root can't modify until -i)
```

`chattr +i` (immutable) protects a critical config from accidental change, even by root. **inotify watch exhaustion** is a classic wall: file-watching tools hit the per-user watch limit, throwing misleading "no space left on device." Fix: raise `fs.inotify.max_user_watches` via sysctl.

### 13.3 — Configuring the host network

```bash
# Ubuntu (netplan): edit /etc/netplan/*.yaml, then:
sudo netplan try                  # applies with AUTOMATIC rollback if you lose connectivity — use over SSH
sudo netplan apply                # commit once confirmed
# RHEL/Fedora (NetworkManager):
sudo nmcli con mod "eth0" ipv4.addresses 192.168.1.50/24 ipv4.gateway 192.168.1.1 \
     ipv4.dns 1.1.1.1 ipv4.method manual && sudo nmcli con up eth0
```

`netplan try`'s auto-rollback is the network equivalent of the "keep a second session open" rule — a typo over SSH reverts itself instead of stranding the box. YAML is whitespace-sensitive: spaces, never tabs.

---

## PART 14 — Trust and certificates

Most service-to-service traffic is TLS, and most TLS incidents are mundane: an expired certificate, an incomplete chain, or a clock skew that makes a valid cert look "not yet valid." Knowing where trust lives and how to inspect a cert turns these from outages into five-minute fixes.

▶ Inspect and validate:

```bash
openssl s_client -connect api.internal:443 -servername api.internal </dev/null 2>/dev/null \
  | openssl x509 -noout -dates -subject -issuer     # who issued it, valid-from/to, expiry
echo | openssl s_client -connect host:443 -showcerts   # the full chain the server presents
ls /etc/ssl/certs/                                   # the system CA trust store (Debian/Ubuntu)
sudo update-ca-certificates                          # re-trust after adding a private/internal CA
```

The trust model: server presents cert + chain, client validates back to a root CA in its trust store and checks dates + hostname. Common failures: `unable to get local issuer certificate` = missing intermediate or untrusted CA; `certificate has expired` / `not yet valid` = actual expiry **or a skewed clock** (check `timedatectl` first); hostname mismatch = cert names don't match the address. Internal CAs must be installed in every client's trust store.

---

## PART 15 — Data and log hygiene

Systems that run for months die from the slow problems: logs that fill the disk, no backups when a volume dies, and unverified restores.

### 15.1 — Logs don't grow forever (until they do)

```bash
cat /etc/logrotate.conf; ls /etc/logrotate.d/   # rotation rules: size/time, how many to keep, compression
sudo logrotate -f /etc/logrotate.d/myapp        # force a rotation to test the config
journalctl --disk-usage                          # how much the journal holds
# cap the journal in /etc/systemd/journald.conf: SystemMaxUse=2G, then restart systemd-journald
```

A service logging verbosely with no rotation is a guaranteed future "disk full" incident; rotation (and a journal size cap) is preventive maintenance, not optional.

### 15.2 — Backups, snapshots, and copying data correctly

```bash
rsync -avh --dry-run src/ dest/        # PREVIEW first — always
rsync -avhz --progress src/ user@host:/backup/   # over SSH, compressed
rsync -avh --delete src/ dest/         # mirror (deletes extras in dest — dangerous; dry-run it)
```

## The trailing slash matters: `src/` copies _contents_; `src` copies the _directory itself_. Filesystem **snapshots** (LVM, btrfs, zfs) give instant point-in-time copies, safer than copying live files. Follow **3-2-1** (multiple copies, multiple media, one off-site) and **test the restore**. An untested backup is a guess.

# CAPSTONE — Troubleshooting playbooks

Real incidents don't announce which part they're from. Each playbook is a hypothesis ladder — walk it in order, stop at the first rung that fails.

#### A service is down or won't start

```bash
systemctl status myapp; journalctl -u myapp -n 50    # the actual error and exit code
sudo ss -tlnp | grep :PORT                           # is the port already taken?
df -h; df -i                                         # disk full — blocks OR inodes?
sudo -u myapp env | grep -i path                     # missing env/PATH (config differs from your shell)?
```

Usual causes: port already bound, missing env var or `PATH`, ownership/permission on a data dir, full disk, or a failed dependency (`systemctl list-dependencies`).

#### The disk is full

```bash
df -h; df -i                       # which filesystem, and blocks vs inodes
sudo du -xh / | sort -h | tail -20 # biggest consumers
sudo lsof +L1                      # deleted-but-open files holding space (the sneaky one)
```

Fix the offender, truncate or restart the process holding deleted files, or add space (LVM grow / new volume with `nofail`).

#### It's slow

```bash
uptime; top                        # load + offenders; note %wa and %st
iostat -xz 1 5                     # disk-bound? (%util ~100, high await)
free -h; dmesg -T | grep -i oom    # swapping? recently OOM-killed?
perf top                           # CPU-bound, and where?
sudo biolatency-bpfcc              # storage latency distribution
```

Localize the resource in triage, _then_ reach for the matching deep tool. Don't profile before you've localized.

#### Service A can't reach service B

```bash
sudo ss -tlnp                      # on B: listening — and on 0.0.0.0, not 127.0.0.1?
curl -v http://B:PORT/             # from A: connects? refused? hangs (timeout)?
getent hosts B; dig +short B       # name resolution (and /etc/hosts vs DNS)
ip route; mtr B                    # routable, and where does the path break?
sudo ufw status                    # firewall blocking the port?
sudo tcpdump -ni any host B        # ground truth: does the packet leave, does a reply return?
# containers:  nsenter --target <pid> --net ss -tlnp / curl   # test from B's exact network view
```

Walk it: listening → bound to the right address → resolvable → routable → firewall → and finally the wire. `tcpdump` showing a request leave with no reply ends the app-vs-network debate.

#### Outbound connections suddenly fail ("cannot assign requested address")

```bash
ss -tan state time-wait | wc -l          # TIME_WAIT pile-up from connection churn?
cat /proc/sys/net/ipv4/ip_local_port_range   # ephemeral range size
ulimit -n; ls /proc/<pid>/fd | wc -l     # or is it file-descriptor exhaustion instead?
```

The architectural fix is connection reuse (pooling/keepalive); the stopgap is widening the port range / `tcp_tw_reuse` and raising `nofile`.

#### A container or job was killed for no reason

```bash
dmesg -T | grep -i 'killed process'                 # host OOM killer?
cat /sys/fs/cgroup/<path>/memory.events             # cgroup OOM (hit MemoryMax)?
nvidia-smi                                          # or device-memory OOM (entirely separate)?
```

Three different "out of memory," three different fixes — identify which before touching anything.

#### Cross-host weirdness: certs invalid, logs out of order, intermittent auth failures

```bash
timedatectl; chronyc tracking      # clock skew is the under-suspected cause
```

Sync clocks everywhere and monitor offset as a metric.

#### "Permissions are wide open and it STILL says permission denied"

```bash
getenforce                          # SELinux enforcing?
sudo ausearch -m avc -ts recent     # the actual denial (SELinux)
sudo dmesg | grep -i apparmor       # or AppArmor
```

An LSM is denying it regardless of the file mode — fix the label/profile, don't disable the LSM.

---

# The "don't lock yourself out" checklist

The thread through sudoers, GRUB, fstab, firewall, and sshd: one small privileged mistake can sever your own access.

1. **Keep a second root session open** while editing anything privileged.
2. **Back up first:** `cp /etc/fstab /etc/fstab.bak`.
3. **Validate before trusting:** `visudo -c`, `mount -a`, `sshd -t`, `nginx -t`.
4. **Allow SSH (port 22) before enabling any firewall.**
5. **Test a new login method in a new session** before disabling the old one.
6. **Know the recovery shell cold:** GRUB → `e` → `init=/bin/bash`.

---

# Where to go next

You now have the spine: what the system is made of (files, the shell, terminals), how it runs work (processes, memory, users, storage, boot), how machines talk (networking), how they isolate and secure (namespaces, cgroups, LSMs), how the shell and scripts really work, how to harden a box, and how to tune the kernel for load.

To deepen it, the only method that works is deliberate practice on a sandbox you can destroy: fill the inodes, exhaust a cgroup's memory, wedge a process in `D` state on slow I/O, skew a clock and watch TLS break, lock yourself out of sudo and recover through the GRUB shell, capture a failing connection with `tcpdump`, and read a core dump in `gdb`. Watching the system tell you what's wrong is what turns these tools from commands you look up into a language you read fluently.

Everything layered on top (Docker, Kubernetes, Terraform/Ansible, Prometheus, service meshes, training frameworks and their schedulers) is an abstraction over the primitives in this handbook. The abstractions change every few years; this layer does not. When they break, and they will, you debug them right here. That permanence is why it's worth owning.

Worth reading deeper: Brendan Gregg on systems performance and eBPF; Michael Kerrisk's _The Linux Programming Interface_ and the man7.org pages; _Designing Data-Intensive Applications_ for the distributed-systems reasoning; the kernel's own `Documentation/` tree; and Julia Evans' zines for the friendliest on-ramps to strace, networking, and debugging.

---

# APPENDIX A: Advanced Linux concepts

Each concept is framed as a question because that forces precision. Answers include the _why_, the diagnostic command, and the fix.

---

#### 1. What happens between typing `ls` and seeing output?

Shell expands the line, searches `$PATH`, finds `/usr/bin/ls`. Calls `fork()` (COW), child calls `execve()`. Kernel loads `ld.so` which maps shared libs. `ls` calls `openat()`/`getdents64()` to read the directory, `write()` to stdout via the tty/PTY. `ls` exits, becomes a zombie, shell `wait()`s and reaps it.

```bash
strace -e trace=openat,getdents64,write ls /tmp   # watch the actual syscalls
```

---

#### 2. A process is in `D` state. `kill -9` does nothing. Why?

`D` = uninterruptible sleep. The process is stuck in a kernel I/O path (typically a hung disk or NFS mount). Signals are only delivered when a process returns to userspace or enters interruptible sleep. A `D`-state task does neither, so no signal reaches it, including SIGKILL.

```bash
ps aux | awk '$8 ~ /D/'           # find D-state processes
cat /proc/<pid>/stack              # see WHERE in the kernel it is stuck
cat /proc/<pid>/wchan              # the kernel function it is blocked in
```

Fix the underlying I/O (restore the NFS server, unblock the disk). The pending kill takes effect once the I/O completes.

---

#### 3. How do you safely edit the sudoers file?

Never open `/etc/sudoers` in a plain editor. A syntax error locks everyone out of `sudo`, and you need sudo to fix it. Use `visudo`, which validates before saving.

```bash
sudo visudo -f /etc/sudoers.d/deploy           # edit a drop-in (preferred over touching the main file)
sudo visudo -cf /etc/sudoers.d/deploy           # syntax-check without editing
# example rule: grant only specific commands
# deploy ALL=(root) NOPASSWD: /usr/bin/systemctl restart myapp
```

If you break it: boot recovery shell (`init=/bin/bash`), `mount -o remount,rw /`, run `visudo`.

---

#### 4. `df` says full, `du` disagrees. Why?

A deleted file that a process still has open. The directory entry is gone (so `du` doesn't see it), but the inode keeps its blocks until the last FD closes. `df` reads the filesystem's free-block count, which still shows the space used.

```bash
sudo lsof +L1                                  # open files with link count 0 (deleted but held)
sudo truncate -s 0 /proc/<pid>/fd/<N>          # reclaim space without restarting the process
df -i                                           # also check: out of inodes, not blocks?
```

---

#### 5. Explain copy-on-write fork() and when it fails with ENOMEM despite free RAM.

`fork()` marks both parent and child pages read-only and shared. Pages are copied only when one side writes (COW), making fork cheap. The ENOMEM case: with strict overcommit (`vm.overcommit_memory=2`), the kernel must reserve virtual space for the child's potential COW writes. A 30 GB parent forking a tiny child can be refused because the reservation exceeds the commit limit, even though RSS is low.

```bash
cat /proc/sys/vm/overcommit_memory             # 0=heuristic, 1=always, 2=strict
grep Committed /proc/meminfo                   # current committed vs limit
```

Mitigations: `posix_spawn` / `vfork` (no address-space duplication), or tune `overcommit_ratio`.

---

#### 6. Container vs VM at the kernel level.

A VM runs a separate guest kernel on virtual hardware. Strong isolation, higher overhead. A container shares the host kernel, confined by **namespaces** (visibility), **cgroups** (resource caps), **capabilities + seccomp** (allowed operations). Trade-off: shared kernel = shared attack surface. High-isolation needs reach for lightweight VMs (Firecracker, Kata).

```bash
sudo unshare --pid --mount --uts --fork --mount-proc bash   # make a minimal "container" by hand
ls /proc/1/ns/                                              # a process's namespace memberships
```

---

#### 7. Why is "free memory near zero" usually fine?

Linux uses idle RAM as a **page cache** for file contents. That cache is instantly reclaimable under pressure, so the meaningful number is `available`, not `free`.

```bash
free -h                            # read the "available" column
cat /proc/meminfo | grep -E 'Available|Cached|Dirty'
```

Writes land in cache as **dirty** pages and flush asynchronously. A crash loses unflushed dirty pages. Durability requires `fsync()`. Journaling protects filesystem _metadata consistency_; `fsync` protects _your data_. They are different guarantees.

---

#### 8. Thousands of TIME_WAIT sockets, new connections fail.

The side that closes first holds the socket in TIME_WAIT (~60s) to absorb stray packets. A client churning short-lived connections exhausts the ephemeral port range, and `connect()` returns EADDRNOTAVAIL while everything else looks fine.

```bash
ss -tan state time-wait | wc -l                        # count TIME_WAIT sockets
cat /proc/sys/net/ipv4/ip_local_port_range             # how many ports available
sudo sysctl -w net.ipv4.tcp_tw_reuse=1                 # allow reuse for outbound (safe)
sudo sysctl -w net.ipv4.ip_local_port_range="1024 65535"  # widen the range
```

The real fix is architectural: connection pooling, HTTP keepalive, persistent connections. Stop churning.

---

#### 9. Signals in a multithreaded process: which thread handles it?

Disposition (handler/ignore/default) is process-wide. Delivery depends on type. A process-directed signal (`kill <pid>`) goes to _any_ unblocking thread. A fault signal (SIGSEGV, SIGFPE) goes to the _causing_ thread. Best practice: block signals in all threads, handle them in one dedicated thread via `signalfd` or `sigwait`, because async signal handlers can only safely call async-signal-safe functions.

```bash
kill -l                           # list all signals and their numbers
cat /proc/<pid>/status | grep SigBlk   # the signal mask (blocked signals, in hex)
```

---

#### 10. How do `nice`, `cpu.weight`, and `cpu.max` interact?

CFS schedules by proportional weight. `nice` adjusts a task's weight; lower nice = more share _under contention_. When CPU is idle, nice has no effect. In cgroups v2, `cpu.weight` is the same idea applied to a group. `cpu.max` is different: it is a hard bandwidth quota (`quota/period`). A group is _descheduled_ when it exhausts its quota, even if CPUs are idle.

```bash
cat /sys/fs/cgroup/myapp/cpu.max       # e.g. "50000 100000" = 50% of one core
cat /sys/fs/cgroup/myapp/cpu.stat      # throttled_usec shows cumulative throttle time
renice -n 10 -p <pid>                  # lower priority of a background job
```

The practical trap: Kubernetes CPU limits use `cpu.max`, and they cause throttling and tail latency spikes on an otherwise idle node. `cpu.weight` only bites under real contention.

---

#### 11. What is NUMA and why does it silently hurt performance?

Multi-socket servers attach memory per-socket. Local access is fast; cross-socket access crosses an interconnect with higher latency and lower bandwidth. The default first-touch policy allocates pages on whatever node first writes them. If threads migrate across sockets, they pay remote-access penalties. This can roughly halve effective bandwidth with no error and nothing obvious in a profile.

```bash
numactl --hardware                                      # NUMA topology: nodes, memory, distances
numastat -p <pid>                                       # per-process: local vs remote hits
numactl --cpunodebind=0 --membind=0 ./app               # pin CPU and memory to node 0
nvidia-smi topo -m                                      # GPU/CPU/NIC affinity matrix
```

On accelerator nodes, the feeding process, its pinned host memory, the NIC, and the GPU should share one NUMA node.

---

#### 12. Debug: `cannot open shared object file: libfoo.so.7`

The dynamic linker cannot resolve a shared library at startup.

```bash
ldd ./binary                          # which libs resolve, which say "not found"
readelf -d ./binary | grep NEEDED     # what the binary was built against
ldconfig -p | grep foo                # what the system actually has
file ./binary                         # architecture: x86-64 vs aarch64 mismatch?
```

Causes in order: not installed, not on the search path (`/etc/ld.so.conf*` + `LD_LIBRARY_PATH`), or the **soname version differs** (built against `.so.7`, system has `.so.6`). This is the root of most "works on my machine" failures with CUDA, MKL, MPI, and other native libraries, and a primary reason container images exist.

---

#### 13. Distributed training scales poorly from 1 to 8 nodes. How do you diagnose?

Poor node scaling usually means the job is **communication-bound**, not compute-bound. Synchronous training does all-reduce (gradient averaging) every step, and collectives are gated by the slowest link.

```bash
nvidia-smi -l 1                       # GPU util: idle bursts = waiting on comms or data
iperf3 -c <peer>                      # actual fabric bandwidth between nodes
ip -s link show ib0                   # InfiniBand/RDMA interface counters
top; cat /proc/pressure/io            # rule out CPU/disk input bottleneck
nvidia-smi topo -m                    # verify NVLink/RDMA path is in use, not TCP fallback
```

Three alternatives to rule out: **input bottleneck** (pegged data loaders, high iowait, GPUs idle), **straggler** (one node consistently slower: thermal throttle, degraded NIC, noisy neighbor), **topology misalignment** (GPU and NIC on different NUMA nodes, or collectives falling back to TCP instead of RDMA).

---

#### 14. The three different "out of memory" failures.

They look similar ("process killed", "out of memory") but are completely different problems with different fixes:

| Failure        | Where                                                           | Detect                                                      | Fix                                                                 |
| -------------- | --------------------------------------------------------------- | ----------------------------------------------------------- | ------------------------------------------------------------------- |
| Host OOM       | kernel kills a process to save the system                       | `dmesg -T \| grep -i oom`                                   | raise host RAM, fix the leak, set proper limits                     |
| Cgroup OOM     | process exceeds its cgroup `memory.max` while host has free RAM | `cat /sys/fs/cgroup/.../memory.events` (look at `oom_kill`) | raise `MemoryMax`, profile the workload                             |
| GPU/device OOM | device memory exhausted (separate from host RAM)                | `nvidia-smi`, "CUDA out of memory" in logs                  | smaller batch size, gradient checkpointing, free cached allocations |

```bash
dmesg -T | grep -i 'killed process'                  # host OOM
cat /sys/fs/cgroup/system.slice/myapp/memory.events   # cgroup OOM
nvidia-smi --query-gpu=memory.used,memory.total --format=csv   # device memory
```

Identify which one _before_ changing anything.

---

#### 15. What happens from power-on to a login prompt?

Firmware (UEFI/BIOS) > **GRUB** (picks kernel) > **kernel + initramfs** (tiny root with drivers to find the real root) > mounts real root > execs **PID 1 (systemd)** > systemd resolves the target dependency graph > starts units in parallel (mounts, journal, networking, services) > `getty` / display-manager presents login.

```bash
systemd-analyze                     # total boot time
systemd-analyze blame | head       # slowest units
systemd-analyze critical-chain     # the critical path through the dependency graph
journalctl -b -1                   # previous boot's logs (post-crash forensics)
```

Knowing the chain localizes failures: firmware/boot-order, GRUB config, missing initramfs driver, bad fstab (emergency mode), or a failing service.

---

#### 16. strace vs eBPF: when to use which.

`strace` uses `ptrace`, which stops the target on every syscall entry/exit. That is 10-100x slowdown. Fine for a sick process on a dev box. Dangerous on a hot production service.

eBPF runs verified programs inside the kernel at tracepoints/kprobes with negligible overhead. It sees system-wide. Production-safe.

```bash
strace -c -p <pid>                                    # per-syscall summary (dev/debug only)
sudo bpftrace -e 'tracepoint:syscalls:sys_enter_openat { @[comm] = count(); }'  # system-wide, ~0 overhead
sudo execsnoop-bpfcc                                  # every new process, live
sudo biolatency-bpfcc                                 # storage latency histogram
```

Rule: `strace` for deep single-process inspection offline; `bpftrace`/BCC for anything production or fleet-wide.

---

#### 17. A container can bind port 80 inside, but two containers both bind 80. How?

Each container gets its own **network namespace** with its own network stack, interfaces, and port space. Port 80 inside container A and port 80 inside container B are in different namespaces. They don't conflict. The host maps them to different host ports (or uses separate IPs) via DNAT rules.

```bash
sudo nsenter --target <pid> --net ss -tlnp            # see what a container is listening on
sudo iptables -t nat -L -n | grep DNAT               # the port-forwarding rules Docker/K8s wrote
```

---

#### 18. How does a CI/CD pipeline interact with Linux primitives?

A CI runner (Jenkins agent, GitHub Actions runner, GitLab runner) is a process on a Linux host. Each job typically runs in a container (namespace isolation) or a fresh VM. The build happens through standard syscalls: `clone`/`exec` to spawn build steps, `openat`/`read`/`write` for file I/O, `connect` for pulling dependencies. Common failures map to the handbook:

- **Build runs out of space** > `df -h` on the runner, stale build caches, Docker image layer bloat
- **"Too many open files"** > `ulimit -n`, `fs.file-max` (Part 10)
- **Flaky network pulls** > DNS resolution (`getent hosts`), ephemeral port exhaustion, proxy/firewall rules
- **Slow builds** > `iostat` (disk-bound?), `perf top` (CPU-bound compilation?), `free -h` (swapping?)

```bash
# inside a CI job, debug a slow step:
time make -j$(nproc) 2>&1 | tail      # wall clock + parallelism
iostat -xz 1 3                         # is the disk the bottleneck?
```

---

#### 19. GPU memory vs host memory: the full picture on an accelerator node.

An accelerator node has two separate memory pools. **Host RAM** (managed by the kernel, visible in `free`/`/proc/meminfo`) and **device memory** (managed by the GPU driver/runtime, visible in `nvidia-smi`). Data must be copied between them (or zero-copied via pinned/mapped memory). Pinned (page-locked) host memory is not swappable and counts against host RAM, so over-pinning contributes to host OOM.

```bash
free -h                                                # host memory
nvidia-smi --query-gpu=memory.used,memory.free --format=csv   # device memory
cat /proc/buddyinfo                                    # host memory fragmentation
# watch both simultaneously:
watch -n1 'free -h; echo "---"; nvidia-smi --query-gpu=memory.used --format=csv'
```

`/dev/shm` (shared memory, RAM-backed) is used heavily by multi-worker data pipelines. Containers default to a tiny `--shm-size` (64MB), causing cryptic failures when workers try to share tensors. Fix: `docker run --shm-size=8g`.

---

#### 20. Service discovery and DNS in distributed systems.

In a fleet, services find each other through DNS or a service registry. On Linux, name resolution follows `/etc/nsswitch.conf`: typically `/etc/hosts` first, then DNS via `/etc/resolv.conf`. A stale `/etc/hosts` entry overrides DNS silently.

```bash
getent hosts api.internal              # how the SYSTEM resolves it (honors nsswitch + /etc/hosts)
dig +short api.internal                # DNS specifically (bypasses /etc/hosts)
cat /etc/resolv.conf                   # which resolvers, search domains
resolvectl status 2>/dev/null          # systemd-resolved state (if in use)
```

When `getent` and `dig` disagree, the problem is `/etc/hosts` or nsswitch order, not DNS. In Kubernetes, pod DNS is managed by CoreDNS, and `ndots:5` in `resolv.conf` causes every short name to generate multiple search-domain queries before the real lookup, which adds latency and load.

```bash
# inside a K8s pod:
cat /etc/resolv.conf                   # note the search domains and ndots value
time getent hosts external-api.com     # slow? ndots is expanding the query
```
