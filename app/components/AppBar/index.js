import React, {Component} from 'react';
import IconButton from 'components/IconButton';
import IconPopover from 'components/IconPopover';
import SelectField from 'components/SelectField';
import Snackbar from 'components/Snackbar';
import TextField from 'components/TextField';
import Drawer from 'components/Drawer';
import Radio from 'components/Radio';
import Dialog from 'components/Dialog';
import getPropsFromInputs from 'utils/form';
import FlatButton from 'components/FlatButton';
import ClickAway from 'internals/ClickAway';
import fetch from 'utils/fetch';
import cookie from 'utils/cookie';
import {index} from 'utils/dom';
import {history} from 'routes';
import moment from 'utils/date';
import styles from './styles.css';

class ApplyDialog extends Component {
	state = {
		isPurchased: true
	}
	
	shouldComponentUpdate(nextProps, nextState) {
		return nextState.isPurchased !== this.state.isPurchased;
	}

	open() {
		this.setState({isPurchased: true});
		this.dialog.open('申请');
	}

	onChange = (val) => {
		const isPurchased = val == '购买';
		this.setState({isPurchased: isPurchased});
	}

	onChecked = () => {
		const isChecked = this.assetRadio.rawRadio.checked;
		if (isChecked) {
			this.assetRadio.checked();
			this.generalRadio.unChecked();
		} else {
			this.assetRadio.unChecked();
			this.generalRadio.checked();
		}
	}

	onConfirm = (dialogContent) => {
		const isPurchased = this.state.isPurchased;
		const apply = getPropsFromInputs(dialogContent);
		apply.userId = +cookie.get('uid');
		apply.ctime = moment.get();
		if (isPurchased && !apply.detail) {
			this.snackbar.open({message: '请输入你要购买的设备详情!', type: 'warning'});
			return;
		} else if (!isPurchased && !apply.equipmentNumber) {
			this.snackbar.open({message: '请输入设备号!', type: 'warning'});
			return;
		}
		fetch.doPost('apply/add', {apply: apply}).then((data) => {
			const {result, success} = data;
			if (success) {
				this.dialog.close();                
				this.snackbar.open({message: '您的申请已发送, 请静候佳音!', type: 'success'});
			}
		});
	}

	getDialogContent() {
		if (this.state.isPurchased) {
			return (
				<div className="change-content">
					<div className="select-equipment">
	            		<Radio 
	            			name="equipmentType" 
	            			value="耗材" 
	            			defaultChecked={true}
	            			onChecked={this.onChecked}
	            			ref={r => this.generalRadio = r}
	            		/>
	            		<Radio
	            			name="equipmentType" 
	            			value="固定资产" 
	            			onChecked={this.onChecked}
	            			ref={r => this.assetRadio = r}
	            		/>
	            	</div>
	            	<TextField multiLine={true} name="detail" placeholder="详述" />

				</div>
				
			)
		} else {
			return (
				<div className="change-content">
					<TextField name="equipmentNumber" placeholder="设备编号" />
				</div>
			)
		}
	}

	render() {
		const menuItems = ['购买', '领用', '退还', '维修', '维护'];
		
		return (
			<div>
				<Dialog
	                customClassName="apply-dialog"
	                onConfirm={this.onConfirm}
	                ref={r => this.dialog = r}
	            >
	            	<SelectField name="type" menuItems={menuItems} onChange={this.onChange} />
	            	{this.getDialogContent()}
            	</Dialog>
            	<Snackbar ref={r => this.snackbar = r} />
			</div>
			
		)
	}
}

class Bell extends Component {
	state = {
		count: 0
	}

	componentDidMount() {
		const userId = +cookie.get('uid');
		this.timer = setInterval(() => {
			fetch.doPost('notification/getNewest', {acceptUserId: userId}).then((data) => {
				const ids = data.result.map(el => +el.id);
				this.setState({count: ids.length})
			});
		}, 3000);
	}

	componentWillUnmount() {
		clearTimeout(this.timer);
	}

	showNotification = () => {
		history.push('/notifications');
	}

	render() {
		return (
			<IconButton 
				icon="mdi-bell" 
				color="#b4c5cd"  
				hasBadge={true}
				count={this.state.count}
				onClick={this.showNotification}
			/>
		)
	}
}

class AppBar extends Component {
	openDrawer = () => {
		this.drawer.open();
	}
	
	onApply = () => {
		this.applyDialog.open();
	}

	manageAccount = (e) => {
		const currentIndex = index(e.currentTarget);

		if (!currentIndex) {
			history.push('/setting');
		} else {
			const uid = +cookie.get('uid');
			fetch.doPost('user/signout', {uid: uid}).then((data) => {
				const {result} = data;
				if (result.isClear) {
					history.push('/signin');
				}
			});
		}
	}

	getAccountMenu = () => {
		const setting = (
			<div className="account">
				<i className="mdi mdi-settings"></i>设置
			</div>
		);

		const signout = (
			<div className="account" onClick={this.signout}>
				<i className="mdi mdi-signout"></i>登出
			</div>
		);
		return [setting, signout];
	}

	render() {
		const drawerItems = [{
			url: '/users',
			name: '用户',
			icon: 'mdi-account'
		}, {
			url: '/equipment',
			name: '设备',
			icon: 'mdi-mac'
		}, {
			url: '/approval',
			name: '审批',
			icon: 'mdi-approval'
		}, {
			url: '/notifications',
			name: '提醒',
			icon: 'mdi-bell'
		}];
		

		return (
			<div className="nav">
				<header>
					<IconButton icon="mdi-menu" color="#b4c5cd" onClick={this.openDrawer}/>
					<div className="operate">
						<IconButton 
							icon="mdi-plus" 
							color="#b4c5cd"
							onClick={this.onApply}
						/>
						<Bell />
						<IconPopover 
							menuItems={this.getAccountMenu()}
							onClose={this.manageAccount}
							icon="mdi-account-circle"
						/>
					</div>
				</header>

				<Drawer 
					docked={false} 
					title="管理" 
					drawerItems={drawerItems} 
					ref={r => this.drawer = r} 
				/>

				<ApplyDialog ref={r => this.applyDialog = r} />
			</div>
		)
	}
}

export default AppBar;