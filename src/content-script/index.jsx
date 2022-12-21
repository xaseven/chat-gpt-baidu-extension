import 'github-markdown-css'
import { render } from 'preact'
import { getUserConfig } from '../config'
import ChatGPTCard from './ChatGPTCard'
import { config } from './search-engine-configs.mjs'
import './styles.scss'
import { getPossibleElementByQuerySelector } from './utils.mjs'

async function mount(question, siteConfig) {
  const container = document.createElement('div')
  container.className = 'chat-gpt-container'

  const siderbarContainer = getPossibleElementByQuerySelector(siteConfig.sidebarContainerQuery)
  if (siderbarContainer) {
    siderbarContainer.prepend(container)
  } else {
    container.classList.add('sidebar-free')
    const appendContainer = getPossibleElementByQuerySelector(siteConfig.appendContainerQuery)
    if (appendContainer) {
      appendContainer.appendChild(container)
    }
  }

  const userConfig = await getUserConfig()
  render(
    <ChatGPTCard question={question} triggerMode={userConfig.triggerMode || 'always'} />,
    container,
  )
}

const siteRegex = new RegExp(Object.keys(config).join('|'))
const siteName = location.hostname.match(siteRegex)[0]
const siteConfig = config[siteName]

function run() {
  const searchInput = getPossibleElementByQuerySelector(siteConfig.inputQuery)
  if (searchInput && searchInput.value) {
    console.debug('Mount ChatGPT on', siteName)
    mount(searchInput.value, siteConfig)
  }
}

run()

if (siteConfig.watchRouteChange) {
  siteConfig.watchRouteChange(run)
}
