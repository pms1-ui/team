// Mobile-optimized render functions

// Dashboard - Mobile Card Layout
function renderDashboardMobile(container, users) {
    let cardsHtml = '';
    
    for(let uid in users) {
        const name = USER_NAMES[uid] || uid;
        const uGoals = users[uid];
        
        uGoals.forEach(g => {
            cardsHtml += `
                <div class="bg-white rounded-xl border border-blue-50 shadow-sm p-4 mb-4">
                    <div class="flex items-center gap-2 mb-3">
                        <div class="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-[10px]">${name.charAt(0)}</div>
                        <span class="font-bold text-on-surface text-[12px]">${name}</span>
                    </div>
                    <div class="mb-3">
                        <div class="text-[11px] text-on-surface-variant font-bold mb-1">OKR</div>
                        <div class="font-bold text-on-surface text-[13px]">${g.text}</div>
                    </div>
                    <div class="space-y-3">
                        <div class="text-[11px] text-on-surface-variant font-bold">Key Results</div>
                        ${g.keyResults.map(kr => `
                            <div class="bg-surface-container rounded-lg p-3">
                                <div class="text-[12px] font-medium text-on-surface mb-2">${kr.text}</div>
                                <div class="flex items-center gap-2">
                                    <div class="flex-1 bg-white h-2 rounded-full overflow-hidden">
                                        <div class="bg-primary h-full transition-all" style="width: ${kr.progress}%"></div>
                                    </div>
                                    <span class="text-primary font-black text-[12px] min-w-[35px] text-right">${kr.progress}%</span>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        });
    }
    
    return cardsHtml || `<div class="bg-white/50 border border-dashed border-blue-200 h-40 rounded-xl flex items-center justify-center text-on-surface-variant font-bold text-[12px] text-center p-4">표시할 목표 데이터가 없습니다.</div>`;
}

// Goals Set - Mobile Card Layout
function renderGoalsSetMobile(drafts) {
    return drafts.map((g, i) => {
        const isEditable = g.status === '작성중';
        const isPending = g.status.includes('대기중');
        
        let statusBadge = '';
        if(isPending) statusBadge = `<span class="text-[10px] font-bold text-on-surface-variant bg-surface-container px-2 py-1 rounded">승인 대기중</span>`;
        else if(g.status === '합의 완료') statusBadge = `<span class="text-[10px] font-bold text-success bg-success/10 px-2 py-1 rounded">합의 완료</span>`;
        
        return `
            <div class="bg-white rounded-xl border border-blue-50 shadow-sm p-4 mb-4">
                <div class="flex items-center justify-between mb-3">
                    <span class="text-[11px] font-black text-on-surface-variant">No. ${i+1}</span>
                    ${statusBadge}
                </div>
                
                <div class="mb-3">
                    <div class="text-[11px] text-on-surface-variant font-bold mb-1">OKR</div>
                    <textarea rows="2" oninput="updateOKRTitle('${g.id}', this.value)" ${!isEditable?'disabled':''} class="w-full bg-surface-container border border-blue-100 rounded-lg px-3 py-2 text-[13px] font-bold text-on-surface outline-none focus:border-primary resize-none" placeholder="목표 입력">${g.text}</textarea>
                </div>
                
                <div class="mb-3">
                    <div class="text-[11px] text-on-surface-variant font-bold mb-2">Key Results</div>
                    <div class="space-y-2">
                        ${g.keyResults.map((kr, kri) => `
                            <div class="flex items-center gap-2">
                                <input type="text" value="${kr.text}" oninput="updateKRTitle('${g.id}', '${kr.id}', this.value)" ${!isEditable?'disabled':''} class="flex-1 bg-surface-container border border-blue-100 rounded-lg px-3 py-2 text-[12px] font-medium text-on-surface outline-none focus:border-primary" placeholder="KR ${kri+1}">
                                ${isEditable && g.keyResults.length > 1 ? `<button onclick="removeKR('${g.id}', '${kr.id}')" class="text-error p-2"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg></button>` : ''}
                            </div>
                        `).join('')}
                        ${isEditable ? `<button onclick="addKR('${g.id}')" class="text-primary font-bold text-[11px] flex items-center gap-1 py-1"><svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path></svg> KR 추가</button>` : ''}
                    </div>
                </div>
                
                ${isEditable ? `
                    <div class="flex gap-2">
                        <button onclick="submitOKRRequest('${g.id}')" class="flex-1 bg-primary text-white py-2 rounded-lg text-[12px] font-bold">승인 요청</button>
                        <button onclick="removeOKR('${g.id}')" class="px-4 bg-white border border-error text-error py-2 rounded-lg text-[12px] font-bold">삭제</button>
                    </div>
                ` : isPending ? `
                    <button onclick="cancelOKRRequest('${g.id}')" class="w-full border border-error text-error py-2 rounded-lg text-[12px] font-bold">요청 취소</button>
                ` : ''}
            </div>
        `;
    }).join('');
}

// Goals Manage - Mobile Card Layout  
function renderGoalsManageMobile(items) {
    if(items.length === 0) {
        return `<div class="bg-white/50 border border-dashed border-blue-200 h-40 rounded-xl flex items-center justify-center text-on-surface-variant font-bold text-[12px] text-center p-4">합의되거나 요청 진행 중인 목표가 없습니다.</div>`;
    }
    
    return items.map((g, i) => {
        const isPending = g.status.includes('대기중');
        ensureTempStructures(g);
        const krsToRender = g.tempKeyResults || g.keyResults;
        const cTitle = g.tempText !== undefined ? g.tempText : g.text;
        
        return `
            <div class="bg-white rounded-xl border border-blue-50 shadow-sm p-4 mb-4">
                <div class="flex items-center justify-between mb-3">
                    <span class="text-[11px] font-black text-on-surface-variant">No. ${i+1}</span>
                    ${isPending ? `<span class="text-[10px] font-bold text-on-surface-variant bg-surface-container px-2 py-1 rounded">승인 대기중</span>` : ''}
                </div>
                
                <div class="mb-3">
                    <div class="text-[11px] text-on-surface-variant font-bold mb-1">OKR</div>
                    <textarea rows="2" oninput="updateOKRTitle('${g.id}', this.value)" ${isPending ? 'disabled':''} class="w-full bg-surface-container border border-blue-100 rounded-lg px-3 py-2 text-[13px] font-bold text-on-surface outline-none focus:border-primary resize-none disabled:opacity-60">${cTitle}</textarea>
                </div>
                
                <div class="mb-3">
                    <div class="text-[11px] text-on-surface-variant font-bold mb-2">Key Results</div>
                    <div class="space-y-3">
                        ${krsToRender.map(kr => `
                            <div class="bg-surface-container rounded-lg p-3">
                                <input type="text" value="${kr.text}" oninput="updateKRTitle('${g.id}', '${kr.id}', this.value, true)" ${isPending?'disabled':''} class="w-full bg-white border border-blue-100 rounded-lg px-3 py-2 text-[12px] font-medium text-on-surface outline-none focus:border-primary mb-2 disabled:opacity-60">
                                <div class="flex items-center gap-2">
                                    <input type="range" min="0" max="100" value="${kr.progress}" oninput="updateKRProgress('${g.id}', '${kr.id}', this.value)" ${isPending?'disabled':''} class="flex-1 h-2 bg-white rounded-lg appearance-none cursor-pointer disabled:opacity-60" style="accent-color: #0053db;">
                                    <span id="kr-prog-val-${kr.id}" class="text-primary font-black text-[12px] min-w-[35px] text-right">${kr.progress}%</span>
                                </div>
                            </div>
                        `).join('')}
                        ${!isPending ? `<button onclick="addKR('${g.id}', true)" class="text-primary font-bold text-[11px] flex items-center gap-1 py-1"><svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path></svg> KR 추가</button>` : ''}
                    </div>
                </div>
                
                ${isPending ? `
                    <button onclick="cancelOKRRequest('${g.id}')" class="w-full border border-error text-error py-2 rounded-lg text-[12px] font-bold">요청 취소</button>
                ` : `
                    <button onclick="submitModifyRequest('${g.id}')" class="w-full bg-primary text-white py-2 rounded-lg text-[12px] font-bold">수정 요청</button>
                `}
            </div>
        `;
    }).join('');
}

// Requests - Mobile Card Layout
function renderRequestsMobile(combinedList) {
    if(combinedList.length === 0) {
        return `<div class="bg-white/50 border border-dashed border-blue-200 h-40 rounded-xl flex items-center justify-center text-on-surface-variant font-bold text-[12px] text-center p-4">불러올 수 있는 요청 데이터가 없습니다.</div>`;
    }
    
    return combinedList.map(item => {
        if (item.type === 'rnr') {
            const r = item.data;
            const isProcessed = r.status === '합의 완료';
            let requestTypeLabel = r.requestType === '합의' ? 'R&R 합의' : 'R&R 수정';
            let tagClass = r.requestType === '합의' ? 'bg-primary/10 text-primary' : 'bg-purple-50 text-purple-700';
            
            let diffHtml = '';
            if (r.requestType === '수정') {
                diffHtml = `
                    <div class="space-y-6 max-h-[75vh] overflow-y-auto px-2 custom-scroll py-2">
                        <div class="flex flex-col gap-2">
                            <div class="text-[14px] font-black text-on-surface-variant uppercase tracking-wider pl-1 font-display">R&R 수정 요청</div>
                            <div class="grid grid-cols-2 gap-4">
                                <div class="p-5 bg-error/5 text-error text-[13px] rounded-xl border border-error/10 relative">
                                    <span class="absolute top-0 right-0 bg-error text-white text-[11px] font-bold px-2 py-0.5 rounded-bl-lg rounded-tr-xl">AS-IS</span>
                                    <pre class="font-sans leading-relaxed whitespace-pre-wrap">${r.content}</pre>
                                </div>
                                <div class="p-5 bg-success/5 text-success text-[13px] font-bold rounded-xl border border-success/20 relative shadow-sm">
                                    <span class="absolute top-0 right-0 bg-success text-white text-[11px] font-bold px-2 py-0.5 rounded-bl-lg rounded-tr-xl">TO-BE</span>
                                    <pre class="font-sans leading-relaxed whitespace-pre-wrap">${r.tempContent}</pre>
                                </div>
                            </div>
                        </div>
                    </div>
                `.replace(/"/g, '&quot;').replace(/\n/g, '');
            } else {
                diffHtml = `
                    <div class="space-y-6 max-h-[75vh] overflow-y-auto px-2 custom-scroll py-2">
                        <div class="flex flex-col gap-2">
                            <div class="text-[14px] font-black text-on-surface-variant uppercase tracking-wider pl-1 font-display">R&R 합의 요청</div>
                            <div class="p-5 text-on-surface text-[13px] bg-white rounded-xl border border-blue-100 shadow-sm">
                                <pre class="font-sans leading-relaxed whitespace-pre-wrap">${r.content}</pre>
                            </div>
                        </div>
                    </div>
                `.replace(/"/g, '&quot;').replace(/\n/g, '');
            }
            
            return `
                <div class="bg-white rounded-xl border border-blue-50 shadow-sm p-4 mb-4">
                    <div class="flex items-center justify-between mb-3">
                        <div class="flex items-center gap-2">
                            <div class="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-[10px]">${r.name.charAt(0)}</div>
                            <span class="font-bold text-on-surface text-[12px]">${r.name}</span>
                        </div>
                        <span class="text-[11px] text-on-surface-variant font-medium">-</span>
                    </div>
                    
                    <div class="mb-3">
                        <div class="text-[11px] text-on-surface-variant font-bold mb-1">성격</div>
                        <div class="flex flex-wrap gap-1">
                            <span class="px-2 py-1 ${tagClass} text-[10px] font-bold rounded">${requestTypeLabel}</span>
                        </div>
                    </div>
                    
                    <div class="flex gap-2 mb-3">
                        <button onclick="openModal('R&R 상세 내용', \`${diffHtml}\`, null, true)" class="flex-1 bg-white border border-blue-100 text-primary font-bold text-[11px] py-2 rounded-lg">상세 내용 확인</button>
                        ${r.comment ? `<button onclick="openModal('요청 전달 코멘트', '<div class=\\'p-4 bg-surface-container rounded-lg text-[13px] text-on-surface font-medium\\'>${r.comment.replace(/\n/g, '<br/>')}</div>', null, false)" class="flex-1 bg-white border border-blue-100 text-on-surface font-bold text-[11px] py-2 rounded-lg">코멘트 보기</button>` : ''}
                    </div>
                    
                    ${isProcessed ? `
                        <button onclick="undoRnRApproval(${r.id})" class="w-full bg-white border border-error text-error font-bold text-[12px] py-2 rounded-lg">승인 취소</button>
                    ` : `
                        <button onclick="approveRnRRequest(${r.id})" class="w-full bg-primary text-white font-bold text-[12px] py-2 rounded-lg">승인 처리</button>
                    `}
                </div>
            `;
        } else {
            const g = item.data;
            const assignee = USER_NAMES[g.userId] || g.userId;
            const period = getPeriodLabel(g.periodType, g.periodValue);
            let types = (g.requestType || '신규 수립').split(',');
            
            let tagsHtml = types.map(t => {
                let c = 'bg-surface-container-low text-on-surface-variant';
                const s = t.trim();
                if(s === '신규 수립') c = 'bg-primary/10 text-primary';
                else if(s.includes('진척률')) c = 'bg-[#fef3c7] text-[#b45309]';
                else if(s.includes('OKR')) c = 'bg-[#ecfdf5] text-[#047857]';
                else if(s.includes('KR')) c = 'bg-purple-50 text-purple-700';
                return `<span class="px-2 py-1 ${c} text-[10px] font-bold rounded">${s}</span>`;
            }).join(' ');
            
            const diffHtml = createDiffContent(g);
            
            return `
                <div class="bg-white rounded-xl border border-blue-50 shadow-sm p-4 mb-4">
                    <div class="flex items-center justify-between mb-3">
                        <div class="flex items-center gap-2">
                            <div class="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-[10px]">${assignee.charAt(0)}</div>
                            <span class="font-bold text-on-surface text-[12px]">${assignee}</span>
                        </div>
                        <span class="text-[11px] text-on-surface-variant font-medium">${period}</span>
                    </div>
                    
                    <div class="mb-3">
                        <div class="text-[11px] text-on-surface-variant font-bold mb-1">성격</div>
                        <div class="flex flex-wrap gap-1">${tagsHtml}</div>
                    </div>
                    
                    <div class="flex gap-2 mb-3">
                        <button onclick="openModal('상세 결재 내용 전후 비교', \`${diffHtml}\`, null, true)" class="flex-1 bg-white border border-blue-100 text-primary font-bold text-[11px] py-2 rounded-lg">상세 내용 확인</button>
                        ${g.comment ? `<button onclick="openModal('요청 전달 코멘트', '<div class=\\'p-4 bg-surface-container rounded-lg text-[13px] text-on-surface font-medium\\'>${g.comment.replace(/\n/g, '<br/>')}</div>', null, false)" class="flex-1 bg-white border border-blue-100 text-on-surface font-bold text-[11px] py-2 rounded-lg">코멘트 보기</button>` : ''}
                    </div>
                    
                    ${g.isProcessed ? `
                        <button onclick="undoApproval(${g.id})" class="w-full bg-white border border-error text-error font-bold text-[12px] py-2 rounded-lg">승인 취소</button>
                    ` : `
                        <button onclick="approveAdminRequest(${g.id})" class="w-full bg-primary text-white font-bold text-[12px] py-2 rounded-lg">승인 처리</button>
                    `}
                </div>
            `;
        }
    }).join('');
}

// Members - Mobile Card Layout
function renderMembersMobile(members, teams) {
    return members.map((member, i) => `
        <div class="bg-white rounded-xl border border-blue-50 shadow-sm p-4 mb-4">
            <div class="flex items-center justify-between mb-3">
                <span class="text-[11px] font-black text-on-surface-variant">No. ${i+1}</span>
                <button onclick="removeMember(${member.id})" class="text-error text-[11px] font-bold px-3 py-1 border border-error rounded-lg">삭제</button>
            </div>
            
            <div class="space-y-3">
                <div>
                    <div class="text-[11px] text-on-surface-variant font-bold mb-1">구성원</div>
                    <input type="text" value="${member.name}" oninput="updateMemberField(${member.id}, 'name', this.value)" class="w-full bg-surface-container border border-blue-100 rounded-lg px-3 py-2 text-[13px] font-bold text-on-surface outline-none focus:border-primary" placeholder="이름 입력">
                </div>
                
                <div>
                    <div class="text-[11px] text-on-surface-variant font-bold mb-1">이메일</div>
                    <input type="email" value="${member.email || ''}" oninput="updateMemberField(${member.id}, 'email', this.value)" class="w-full bg-surface-container border border-blue-100 rounded-lg px-3 py-2 text-[12px] font-medium text-on-surface outline-none focus:border-primary" placeholder="이메일 입력">
                </div>
                
                <div>
                    <div class="text-[11px] text-on-surface-variant font-bold mb-1">팀명</div>
                    <select onchange="updateMemberField(${member.id}, 'team', this.value)" class="w-full bg-surface-container border border-blue-100 rounded-lg px-3 py-2 text-[13px] font-medium text-on-surface outline-none focus:border-primary">
                        <option value="">팀 선택</option>
                        ${teams.map(team => `<option value="${team.name}" ${member.team === team.name ? 'selected' : ''}>${team.name}</option>`).join('')}
                    </select>
                </div>
                
                <div>
                    <div class="text-[11px] text-on-surface-variant font-bold mb-1">직무</div>
                    <input type="text" value="${member.job || ''}" oninput="updateMemberField(${member.id}, 'job', this.value)" class="w-full bg-surface-container border border-blue-100 rounded-lg px-3 py-2 text-[13px] font-medium text-on-surface outline-none focus:border-primary" placeholder="직무 입력">
                </div>
                
                <div>
                    <div class="text-[11px] text-on-surface-variant font-bold mb-1">직책</div>
                    <select onchange="updateMemberField(${member.id}, 'position', this.value)" class="w-full bg-surface-container border border-blue-100 rounded-lg px-3 py-2 text-[13px] font-medium text-on-surface outline-none focus:border-primary" ${STATE.user.role !== 'admin' && STATE.user.id !== member.user_id ? 'disabled' : ''}>
                        <option value="리더" ${member.position === '리더' ? 'selected' : ''}>리더</option>
                        <option value="멤버" ${member.position === '멤버' ? 'selected' : ''}>멤버</option>
                    </select>
                </div>
                
                <div>
                    <div class="text-[11px] text-on-surface-variant font-bold mb-1">아이디</div>
                    <input type="text" value="${member.user_id || ''}" oninput="updateMemberField(${member.id}, 'user_id', this.value)" class="w-full bg-surface-container border border-blue-100 rounded-lg px-3 py-2 text-[12px] font-medium text-on-surface outline-none focus:border-primary" placeholder="아이디 입력" ${STATE.user.role !== 'admin' ? 'readonly' : ''}>
                </div>
                
                <div>
                    <div class="text-[11px] text-on-surface-variant font-bold mb-1">비밀번호</div>
                    <input type="password" value="${member.password || ''}" oninput="updateMemberField(${member.id}, 'password', this.value)" class="w-full bg-surface-container border border-blue-100 rounded-lg px-3 py-2 text-[12px] font-medium text-on-surface outline-none focus:border-primary" placeholder="비밀번호 입력" ${STATE.user.role !== 'admin' ? 'readonly' : ''}>
                </div>
            </div>
        </div>
    `).join('');
}
