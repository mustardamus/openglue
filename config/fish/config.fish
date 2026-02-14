# Disable the default greeting
set -g fish_greeting

# Starship prompt
set -gx STARSHIP_CONFIG (status dirname)/../starship.toml
starship init fish | source
