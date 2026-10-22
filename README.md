# OWTranslate

OWTranslate is an Exponential extension for people who maintain the interface
translations of a site. It does two things:

1. **Generation**: it reads the templates and PHP files of the extensions you
   choose, finds every translatable string in them, and writes one
   `translation.ts` file per site language with all of those strings.
2. **Translation in the admin**: it lists every string of those files side by
   side for all languages, with paging and a search, and lets you translate a
   string inline (click a cell, type, press Enter) or in a full edit form.

It is meant for site builders and translators who would rather not edit
`translation.ts` XML by hand or install Qt Linguist.

- Admin tab: **Translation**, drawn with the `translate` icon in the admin4 design.
- Module: `translate` (`/translate/list`, `/translate/generation`, ...).
- License: GNU General Public License v2.0 (see [LICENSE](LICENSE)).

## Requirements

- Exponential 6.x (the legacy kernel), with an admin siteaccess.
- PHP 8.0 or later with the DOM extension (`ext-dom`).
- Write access for the web server user to the `translations/` directory of the
  extension the files are generated into (see `[MainExtension]` below).

## Installation

### With Composer

```bash
composer require se7enxweb/owtranslate
```

The Exponential legacy installer places the extension in `extension/owtranslate`.
Then continue with step 2 of the manual installation.

### By hand

1. Copy (or `git clone`) the extension into `extension/owtranslate`. The directory
   must be called `owtranslate` in lowercase: the extension's own settings refer
   to it by that name.

   ```bash
   git clone https://github.com/se7enxweb/OWTranslate.git extension/owtranslate
   ```

2. Activate it in `settings/override/site.ini.append.php`. If OWTranslate is the
   extension the translation files are written to (the default), list it
   **first**, so its translations win over those of the extensions after it:

   ```ini
   [ExtensionSettings]
   ActiveExtensions[]=owtranslate
   ```

3. Regenerate the autoload array and clear the caches:

   ```bash
   php bin/php/ezpgenerateautoloads.php -e
   php bin/php/ezcache.php --clear-all
   ```

4. Give the people who should use it a role with the `translate` policies (see
   [Permissions](#permissions)). Administrators have them already.

## Configuration

Settings live in `owtranslate.ini`. Override them in
`settings/override/owtranslate.ini.append.php` rather than editing the file in
the extension. These are all the settings the extension reads:

```ini
[MainExtension]
# Extension whose translations/ directory the generated files are written to,
# and read from by the list. The default is OWTranslate itself.
directory=owtranslate

[MainLocale]
# Locale of the language the source strings are written in.
locale=eng-GB

[NumberPerPage]
# Strings per page in the list, and the three choices of the page-size toolbar.
default=25
choose1=10
choose2=25
choose3=50

[ExcludeExtension]
# Active extensions that are not offered on the generation page.
extension[]
extension[]=ezjscore
extension[]=ezoe

[LocaleOverride]
# Write and read a different locale directory for a language, e.g. to use
# non-English translation keys. See "Using non-English keys" below.
locale[]
#locale[eng-GB]=eng-GB@override
```

The extension also adds, through its own settings:

- the admin tab `[Topmenu_translate]` in `menu.ini` (`Icon=translate`, URL
  `translate/list`, shown to users with `translate/read`);
- the backend JavaScript `jquery.jeditable.js` and `owtranslate.js` and the
  stylesheet `owtranslate.css` in `design.ini`;
- `TranslationExtensions[]=owtranslate` in `site.ini`, so the files it writes
  into its own `translations/` directory are used by the site.

## Usage

### 1. Generate the translation files

Open the **Translation** tab and choose **Generation** in the left menu
(`/translate/generation`). Tick the extensions to scan and press
**Send generation**.

OWTranslate walks every file of those extensions and collects:

- template strings written as `{'Text'|i18n('my/context')}`, for example

  ```smarty
  {'Read more'|i18n('design/mysite/article')}
  ```

- PHP strings written as `ezpI18n::tr( 'context', 'Text' )`, for example

  ```php
  $title = ezpI18n::tr( 'mysite/article', 'Read more' );
  ```

For every language of the site (Setup, Languages) it then creates
`extension/<directory>/translations/<locale>/translation.ts`, or adds the strings
it does not hold yet to the file that is already there. Existing translations
are kept.

### 2. Translate

Choose **List** (`/translate/list`). Each row is one string; each column one
language.

- Click a translation cell, type, and press Enter (or click elsewhere): the
  value is saved at once through `/translate/ajax_edit`.
- Click the string itself to open the full edit form
  (`/translate/edit/(sourceKey)/<context>/(dataKey)/<string>`) with one text
  area per language.
- Use the search form to filter by context and language
  (`/translate/search?sourceKey=<context>&locale=<locale>`), and the toolbar to
  show 10, 25 or 50 strings per page (`/translate/list/(limit)/50`).

### 3. Make the new translations visible

The site reads `translation.ts` files through its translation cache. Clear it
after a translation session:

```bash
php bin/php/ezcache.php --clear-tag=i18n
```

### Using non-English keys

If your templates use keys that are not English text (ids, or French
sentences), let the English siteaccess use an override locale:

```ini
# owtranslate.ini.append.php
[LocaleOverride]
locale[eng-GB]=eng-GB@override

# site.ini.append.php of the English siteaccess
[RegionalSettings]
Locale=eng-GB@override
```

OWTranslate then writes and edits the English strings in
`translations/eng-GB@override/translation.ts`.

## Permissions

The module `translate` has two policy functions:

| Function         | What it opens                                          |
|------------------|--------------------------------------------------------|
| `translate/read` | the views `list`, `search`, `edit`, `ajax_edit`; the admin tab |
| `translate/edit` | the view `generation`                                  |

Note that `read` already lets a user change translations; give it only to
translators.

## Upgrading

From 1.2: replace the extension directory, then clear the caches. Nothing in
the database changes. Version 1.3 adds the tab icon and the release metadata
(see [CHANGELOG.md](CHANGELOG.md)); the settings are unchanged.

## Known limits

- Only the two forms shown above are recognized: a template string must be a
  quoted literal piped straight into `i18n()` with one argument, on one line;
  a PHP string must be a two-argument `ezpI18n::tr()` call with literals.
  Strings with a comment or parameters argument are not collected.
- The module declares an `export` view, but the extension ships no script for
  it; `/translate/export` does not work.
- The inline editor posts to the absolute path `/translate/ajax_edit`, so it
  works when the admin siteaccess is chosen by host name, not when it is chosen
  by a path prefix (`/admin/...`).
- Only the `fre-FR` translation of the extension's own interface is shipped.

## Troubleshooting

- **"A problem arose during the files generation"**: the web server cannot
  write to `extension/<directory>/translations/`. Fix its permissions.
- **The list says you have to generate the files first**: no `translation.ts`
  was found under `extension/<directory>/translations/`. Run the generation, or
  check `[MainExtension] directory`.
- **A language column stays empty**: the locale directory must match the
  language's locale (its first six characters, e.g. `fre-FR`), or the
  `[LocaleOverride]` entry for it.
- Errors are logged to `var/log/owtranslate.log`.

## Contributing

Issues and pull requests are welcome at
<https://github.com/se7enxweb/OWTranslate>.

## License

GNU General Public License v2.0. See [LICENSE](LICENSE).

## Credits and history

OWTranslate was written by Open Wide (<http://www.openwide.fr>) in 2012 for eZ
Publish, the PHP content management system that its creator discontinued after
about 18 years, and Open Wide maintained it until 2015. 7x
(<https://se7enx.com>) maintains it today for Exponential, the continuation of
that legacy kernel.
