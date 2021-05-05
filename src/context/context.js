import React, { useState, useEffect } from 'react';
import mockUser from './mockData.js/mockUser';
import mockRepos from './mockData.js/mockRepos';
import mockFollowers from './mockData.js/mockFollowers';
import axios from 'axios';

const rootUrl = 'https://api.github.com';

const GithubContext = React.createContext();

const GithubProvider = ({children}) => {

    const [githubUser, setGithubUser] = useState(mockUser);
    const [githubRepos, setGithubRepos] = useState(mockRepos);
    const [githubFollowers, setGithubFollowers] = useState(mockFollowers);

    const [request, setRequest] = React.useState('');
    const [isLoading, setIsLoading] = React.useState(false);
    const [error, setError] = React.useState({ show:false, msg:"" });

    const searchGithubUser = async (user) => {

        toggleError();
        setIsLoading(true);

        const response = await axios(`${rootUrl}/users/${user}`).catch((err) => console.log(err))
        if(response){
            setGithubUser(response.data)
            const { login, followers_url } = response.data;
            
            // Get Repos
            // await axios(`${rootUrl}/users/${login}/repos?per_page=100`).then((repo) => {
            //     setGithubRepos(repo.data)
            // })

            // Get followers
            // await axios(`${followers_url}?per_page=100`).then((follower) => {
            //     setGithubFollowers(follower.data)
            // })

            await Promise.allSettled([ 
                axios(`${rootUrl}/users/${login}/repos?per_page=100`), 
                axios(`${followers_url}?per_page=100`)
            ]).then((result) => {
                const [ repos, followers ] = result;
                const status = "fulfilled";

                if(repos.status === status){
                    setGithubRepos(repos.value.data)
                }
                if(followers.status === status){
                    setGithubFollowers(followers.value.data)
                }
                // console.log(result)
            }).catch((err) => console.log(err))

        }else{
            setError(true, "there is no user with that username :(")
        }
        requestLimit();
        setIsLoading(false);
    }

    const requestLimit = () => {
        axios(`${rootUrl}/rate_limit`).then(({data}) => {
            let {rate : { remaining }} = data
            setRequest(remaining);
            if(remaining === 0){
                toggleError(true, "sorry, you have exceeded your hourly rate limit!")
            }
        }).catch((err) => console.log(err))
    }

    // Error function
    function toggleError(show = false, msg = ""){
        setError({show, msg})
    }

    useEffect(requestLimit, []);

    return <GithubContext.Provider value={{githubUser, githubRepos, githubFollowers, request, error, searchGithubUser, isLoading}}>
        {children}
    </GithubContext.Provider>
}

export { GithubContext, GithubProvider }
