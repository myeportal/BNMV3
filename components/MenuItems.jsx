import { Dropdown, Menu, Space } from "antd";
import { DownOutlined } from '@ant-design/icons';
import { useRouter } from "next/router";
import Link from "next/link";

function MenuItems({ isDark, isAuthenticated }) {
  const { pathname } = useRouter();

  const menuItems = [
    {
      key: "/mintArticle",
      label: (
        <Link href="/mintArticle">
          <a>Article</a>
        </Link>
      )
    },
    {
      key: "/mintAudio",
      label: (
        <Link href="/mintAudio">
          <a>Music</a>
        </Link>
      )
    },
    {
      key: "mintVideo",
      label: (
        <Link href="/mintVideo">
          <a>Video</a>
        </Link>
      )
    }
  ]

  const menu = (
    <Menu>
      {menuItems.map((item) => (
        <Menu.Item key={item.key}>
          <span>{item.label}</span>
        </Menu.Item>
      ))}
    </Menu>
  )

  return (
    <Menu
      theme={isDark ? "dark" : "light"}
      mode="horizontal"
      style={{
        display: "flex",
        fontSize: "17px",
        fontWeight: "500",
        width: "100%",
        justifyContent: "left",
      }}
      defaultSelectedKeys={[pathname]}
    >
      <Menu.Item>
        <Dropdown overlay={menu} trigger={['click']}>
          <a onClick={(e) => e.preventDefault()}>
              <Space>
                ⛓ Mint
                <DownOutlined />
              </Space>
          </a>
        </Dropdown>
      </Menu.Item>
      <Menu.Item key="/feed">
        <Link href="/feed">
          <a>📰 Feed</a>
        </Link>
      </Menu.Item>
      <Menu.Item key="/profile">
        <Link href="/profile">
          <a>😀 Profile</a>
        </Link>
      </Menu.Item>
    </Menu>
  );
}

export default MenuItems;