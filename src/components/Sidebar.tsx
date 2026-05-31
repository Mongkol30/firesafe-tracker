import { useState, useEffect } from 'react'
import { Sidenav, Nav, HStack, VStack } from 'rsuite'
import DashboardIcon from '@rsuite/icons/Dashboard'
import PeoplesIcon from '@rsuite/icons/Peoples'
import DataAuthorizeIcon from '@rsuite/icons/DataAuthorize'
import PieChartIcon from '@rsuite/icons/PieChart'
import { Link, useLocation } from 'react-router-dom'

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768)
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 768)
    window.addEventListener('resize', handler)
    return () => window.removeEventListener('resize', handler)
  }, [])
  return isMobile
}

function Header({ expanded }: { expanded: boolean }) {
  if (!expanded) {
    return (
      <HStack justifyContent="center" style={{ padding: '18px 0' }}>
        <span style={{ fontSize: 22 }}>🧯</span>
      </HStack>
    )
  }

  return (
    <VStack style={{ padding: '16px 20px 14px' }}>
      <HStack spacing={10} alignItems="center">
        <span style={{ fontSize: 24 }}>🧯</span>
        <div>
          <div style={{ fontWeight: 700, fontSize: 16, color: '#fff', lineHeight: 1.2 }}>
            FireSafe
          </div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', letterSpacing: 1 }}>
            TRACKER
          </div>
        </div>
      </HStack>
    </VStack>
  )
}

function Sidebar() {
  const isMobile = useIsMobile()
  const [expanded, setExpanded] = useState(!isMobile)
  const location = useLocation()

  // หุบ/ขยายตาม screen size
  useEffect(() => {
    setExpanded(!isMobile)
  }, [isMobile])

  // หุบ sidebar อัตโนมัติเมื่อกดเมนูบนมือถือ
  const handleNavClick = () => {
    if (isMobile) setExpanded(false)
  }

  return (
    <div style={{
      height: '100vh',
      width: expanded ? 240 : 56,
      transition: 'width 0.2s ease',
      flexShrink: 0,
    }}>
      <Sidenav
        expanded={expanded}
        appearance="subtle"
        defaultOpenKeys={['1']}
        style={{ height: '100%' }}
      >
        <Sidenav.Header style={{ backgroundColor: '#ba0b1b' }}>
          <Header expanded={expanded} />
        </Sidenav.Header>

        <Sidenav.Body >
          <Nav activeKey={location.pathname}>
            <Nav.Item
              as={Link} to="/" eventKey="/"
              icon={<DashboardIcon />}
              onClick={handleNavClick}
              style={{ marginTop: 4 }}
            >
              Dashboard
            </Nav.Item>

            <Nav.Menu eventKey="1" title="Master" icon={<PieChartIcon />}>
              <Nav.Item
                as={Link} to="/master/extinguishertype" eventKey="1-1"
                onClick={handleNavClick}
              >
                ประเภทถัง
              </Nav.Item>
              <Nav.Item
                as={Link} to="/master/location" eventKey="1-2"
                onClick={handleNavClick}
              >
                ตำแหน่งที่ตั้ง
              </Nav.Item>
              <Nav.Item
                as={Link} to="/master/extinguisher" eventKey="1-3"
                onClick={handleNavClick}
              >
                ถังดับเพลิง
              </Nav.Item>
              <Nav.Item
                as={Link} to="/master/user" eventKey="1-4"
                onClick={handleNavClick}
              >
                ผู้ใช้งาน
              </Nav.Item>
            </Nav.Menu>

            <Nav.Item
              as={Link} to="/inspection" eventKey="/inspection"
              icon={<DataAuthorizeIcon />}
              onClick={handleNavClick}
            >
              Inspection
            </Nav.Item>

            <Nav.Item
              as={Link} to="/history" eventKey="/history"
              icon={<PeoplesIcon />}
              onClick={handleNavClick}
            >
              History
            </Nav.Item>
          </Nav>
        </Sidenav.Body>

        <Sidenav.Footer>
          <Sidenav.Toggle onToggle={setExpanded} />
        </Sidenav.Footer>
      </Sidenav>
    </div>
  )
}

export default Sidebar