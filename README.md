# groshare-web
The companion web app/dashboard for GroShare, built with vanilla HTML/JS and Bootstrap.

## Contributing
### Clone the repo:
```bash
git clone https://github.com/dariostrm/groshare-web.git
```

> [!IMPORTANT]  
> You only need to clone the repo once, after that, before you start working, pull the changes so you have the latest code:
> 
> `git pull`

### Create and switch to a new branch:

Branch names should be named either:
- "feature/what_you_are_adding" if you are adding new functionality or
- "fix/what_you_are_fixing" if you are fixing a bug
  
e.g.
"feature/login_register_pages"
```bash
git switch -c <branch-name>
```

### Make and stage your changes
```bash
git add .
```

### Commit and push your changes
```bash
git commit -m "Short description of what you did"

git push -u origin <branch-name>
```

### Create a pull request
- On GitHub, go to Pull Requests -> New Pull Request -> choose your branch
- Assign Dario as the reviewer
- Reference the issue you fixed/implemented by adding this text to the pull request description:
  - "Resolves #issue-number" (e.g. "Resolves #4")
