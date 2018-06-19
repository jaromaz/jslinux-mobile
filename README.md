# JSLinux Mobile – Linux for iOS

A mobile version of a PC emulator written in Javascript, with a running, fully functional Linux system. The emulator can be run offline in full-screen mode on iOS and Android devices.

Apple does not allow hardware emulation in iOS – the AppStore has no such software, so I have transformed the perfect Linux emulator by Fabrice Bellard (with his kind permission) so that it works properly with iOS device keyboards and bluetooth keyboards in ordinary web browsers (a lot of Javascript tricks :) . All is available in full-screen mode simultaneously emulating modern terminals – appropriate fonts and window appearance.

[Live version](https://jm.iq.pl/jslinux-mobile)
-----------------------------------------------------------------------

For full-screen mode, install the iOS Snowbunny web browser (swipe in the address bar) or the Android Fullscreen web browser. The default preset is intended for iPad with a bluetooth keyboard, but you can change the appearance of the application.

This basic Linux can be used to practice programming in C, bash, support for awk and sed, create a pseudo-network (because this version of the emulator does not allow Linux to connect to the Internet), and learn the basic Linux commands thanks to the Busybox software. In the video bellow, I present the capabilities of the emulator in conjunction with iPad Mini and a bluetooth keyboard: 
https://www.youtube.com/watch?v=9b3E2vIBZeQ

More information: https://jm.iq.pl/jslinux-mobile

Copyright (c) 2018 Jaromaz https://jm.iq.pl
