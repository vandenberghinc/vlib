<!--<img src="https://raw.githubusercontent.com/vandenberghinc/vlib/master/dev/media/icon/icon.green.png" width="150" alt="VLib">-->
# VRepo
VInc package manager for distributing repositories to git, ssh & npm.

<p align="start">
    <img src="https://img.shields.io/badge/version-{{VERSION}}-orange" alt="Bergh-Encryption">
</p> 

#### Installation
```
npm install -g @vandenberghinc/vlib
```

#### CLI Usage
```
vrepo v1.0.1
Usage: $ vrepo [mode] [options]
    --push                          Push the current project to one or multiple remotes.
        --source <string>           The source path to the package, when undefined the current working directory will be used as the package.
        --sources <array>           The source paths to multiple packages, when undefined the argument --source or the current working directory will be used as the package.
        --git <array>               Push to all git or a list of specific git remotes.
        --ssh <array>               Push to all ssh or a list of specific ssh remotes.
        --forced, -f                Push with git in forced mode.
        --del, -d                   Push with ssh in delete mode.
        --ensure-push, -e           Ensure a git push by editing the gitignore safely.
        --log-level, -l <number>    The log level.
    --pull                          Pull the current project from one of the remotes.
        --source <string>           The source path to the package, when undefined the current working directory will be used as the source path.
        --sources <array>           The source paths to multiple packages, when undefined the argument --source or the current working directory will be used as the source path.
        --git <array>               Pull from all git or a list of specific git remotes.
        --ssh <array>               Pull from all ssh or a list of specific ssh remotes.
        --forced, -f                Pull with git in forced mode.
        --del, -d                   Pull with ssh in delete mode.
    --publish-npm                   Publish a npm package.
        --source <string>           The source path to the package, when undefined the current working directory will be used as the source path.
        --sources <array>           The source paths to multiple packages, when undefined the argument --source or the current working directory will be used as the source path.
        --sources <array>           The source paths to multiple packages, when undefined the argument --source or the current working directory will be used as the source path.
        --on-commits-only           Only when local commits have been made.
    --add-remote                    Add a remote.
        --source <string>           The source path to the package, when undefined the current working directory will be used as the source path.
        --ssh <string>              The ssh alias and destination formatted like <alias>:<destination>
        --git                       Add a git remote.
        --remote <string>           The git branch, by default "origin".
        --destination <string>      The git destination.
        --branch <string>           The git branch, by default "main".
    --remotes                       Get the registered remotes.
        --source <string>           The source path to the package, when undefined the current working directory will be used as the source path.
        --sources <array>           The source paths to multiple packages, when undefined the argument --source or the current working directory will be used as the source path.
        --git                       Only show the git remotes.
        --ssh                       Only show the ssh remotes.
    --remove-commit-history         Remove the commit history.
        --source <string>           The source path to the package, when undefined the current working directory will be used as the source path.
        --sources <array>           The source paths to multiple packages, when undefined the argument --source or the current working directory will be used as the source path.
    --remove-git-cache              Remove the git cache.
        --source <string>           The source path to the package, when undefined the current working directory will be used as the source path.
        --sources <array>           The source paths to multiple packages, when undefined the argument --source or the current working directory will be used as the source path.
    --list-large-files              List large files optionally with a gitignore filter.
        --source <string>           The source path to the package, when undefined the current working directory will be used as the source path.
        --sources <array>           The source paths to multiple packages, when undefined the argument --source or the current working directory will be used as the source path.
        --exclude <array>           Exclude file paths.
        --limit <number>            The maximum number of files to list.
        --gitignore, -g             Enable the gitignore filter.
        --directories, -d           Also include directories.
    --set-dependencies              Add dependencies to the package.json file from local target package.json libraries.
        --source <string>           The source path to the package, when undefined the current working directory will be used as the source path.
        --sources <array>           The source paths to multiple packages, when undefined the argument --source or the current working directory will be used as the source path.
        --dependencies <array>      The source path to the local dependencies to add.
    --npm-link                      Simply call npm link on target vrepo projects.
        --source <string>           The source path to the package, when undefined the current working directory will be used as the source path.
        --sources <array>           The source paths to multiple packages, when undefined the argument --source or the current working directory will be used as the source path.
        --dependencies <array>      The source path to the local dependencies to add.
    --npm-unlink                    Unlink all links, check if there are any changed if so publish to npm and update the dependency versions.
        --source <string>           The source path to the package, when undefined the current working directory will be used as the source path.
        --sources <array>           The source paths to multiple packages, when undefined the argument --source or the current working directory will be used as the source path.
    --delete-js-dts                 Delete all unexpected .js and .d.ts files where also a .ts resides under the same name. The user is prompted for confirmation before deletion.
        --target <string>           The target path.
        --exclude <array>           Exclude file paths.
    --help, -h                      Show the overall documentation or when used in combination with a command, show the documentation for a certain command.
```

<!--
## Documentation.
Full documentation at [Github Pages](https://vandenberghinc.github.io/vlib).
-->