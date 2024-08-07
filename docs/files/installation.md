# Installation
Library `vlib` can be installed from github or by using `vinc`.

## Installation with vinc.
Execute the following commands to install `vlib` using `vinc`.

This will install the `vlib` library into `/opt/vinc/vlib/` with a symbolic link for the include directory to `/opt/vinc/include/vlib`.
Make sure the `vinc` binary is available in your `PATH`.

```bash Installation
$ vinc --api-key XXX # set the api key when you are using vinc for the first time.
$ vinc --install vlib
```

## Installation from github.
Execute the following commands to install `vlib` from github.

This will install the `vlib` library into `/opt/vinc/vlib/` with a symbolic link for the include directory to `/opt/vinc/include/vlib`.
The installation may require root priviliges when directory `/opt/vinc/` does not exist.

```
$ git clone https://github.com/vandenberghinc/vlib.git /tmp/vlib
$ chmod +x /tmp/vlib/install
$ /tmp/vlib/install
```
