# PlanB
A Chrome/Chromium browser extension to preserve network content.
This

# Why this plugin?
Chrome and Chromium browsers has a great dev tools and I have been using it for a while for by web development work.
They have been improving it a lot over the years and I am really impressed with the progress it made over the years since its original realase to public. However, one thing I really need it to do but is presently unable to do is preserve the response content over multiple page loads. Make no mistake, there is a preserve log feature that preserves most of the stuff like URLS, methods, headers etc. But the content is not preserved own account of performance implications. When I googled it, I came across these two tickets which have been open for over 2 years! I needed this feature badly and recently I had a bit of free time to tinker with the idea of creating browser extensions. And this my PlanB was born.

# What this extension does?
Simply installing the plugin will add a panel to your dev tools. This panel simply lists network logs the browser is making. But there is this very interesting checkbox for preserving the network content. Simply check it and you are done! The plugin internally gets the content for each and every API call dev tools monitors and caches its response. The really cool feature is that the cached response is ALSO AVAILABLE in the orignal NETWORK panel of the dev tools.

# The Future
I don't have any plans as of now to add more features to this guy. But its something I will be using frequently. I am planning to support this little plugin for future versions of chrome till a better alternative is provided by the official browser gods.

# References
* https://bugs.chromium.org/p/chromium/issues/detail?id=453078
* https://bugs.chromium.org/p/chromium/issues/detail?id=141129

# ChangeLog
v1.2 (2018-01-04)
* Fix for a chrome v63 bug that may smetimes report the extension as corrupted. Fix done as per this thread - https://productforums.google.com/d/msg/chrome/kGgLwnrDKpQ/TFK1DG23BgAJ
* Optimised the icons used inside to reduce overall bundle size.

v1.1 (2018-01-03)
* Minor updates to the manifest file name section.

v1.0 (2018-01-03)
* The very first version.
